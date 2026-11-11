<?php

namespace App\Services;

use App\Models\AboutBlock;
use App\Models\EmployeeStory;
use App\Models\Entity;
use App\Models\Faq;
use App\Models\InterviewStep;
use App\Models\MediaItem;
use App\Models\Recognition;
use App\Models\RecruitmentDrive;
use App\Models\SiteSetting;
use App\Support\CacheVersion;
use App\Support\ContentTypes;
use App\Support\HtmlSanitizer;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class ContentService
{
    /** Site setting keys HR can edit, with the fields each one holds. */
    public const SETTINGS = [
        'hero' => ['eyebrow', 'title', 'motto', 'company_line', 'banner_image'],
        'company_numbers' => ['employees', 'years', 'clients'],
        'entities_section' => ['title', 'intro'],
        'about_intro' => ['title', 'intro'],
        'interview_section' => ['eyebrow', 'title', 'image'],
        'quick_apply_section' => ['title', 'intro', 'image'],
        'faq_section' => ['title'],
        'social_links' => ['links'],
        'footer' => ['closing_title', 'closing_text', 'copyright', 'contact_email', 'contact_phone', 'address', 'tagline'],
        'promo_card' => ['headline', 'tagline', 'image'],
        'quick_apply_confirmation_text' => ['title', 'body'],
    ];

    public function __construct(private readonly ImageService $images) {}

    /**
     * @return Collection<int, Model>
     */
    public function list(string $type): Collection
    {
        $model = ContentTypes::config($type)['model'];
        $query = $model::query()->orderBy('sort_order')->orderBy('id');

        if ($type === 'employee-stories') {
            $query->with('entity:id,name,slug');
        }

        return $query->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function save(string $type, array $data, ?Model $item = null): Model
    {
        $config = ContentTypes::config($type);
        $model = $config['model'];
        $image = $data['image'] ?? null;
        unset($data['image']);

        if ($config['html'] && array_key_exists($config['html'], $data)) {
            $data[$config['html']] = HtmlSanitizer::clean($data[$config['html']]);
        }

        if ($type === 'employee-stories' && array_key_exists('entity', $data)) {
            $data['entity_id'] = filled($data['entity']) ? Entity::query()->where('slug', $data['entity'])->value('id') : null;
            unset($data['entity']);
        }

        if ($type === 'media-items' && ($data['type'] ?? $item?->type?->value ?? $item?->type) === 'activity') {
            $data['youtube_url'] = null;
        }

        return DB::transaction(function () use ($model, $item, $data, $config, $image) {
            $item ??= new $model(['sort_order' => ((int) $model::query()->max('sort_order')) + 1]);

            if (! $item->exists && $config['image'] && blank($item->getAttribute($config['image']))) {
                $item->setAttribute($config['image'], '');
            }

            $item->fill($data)->save();

            if ($image instanceof UploadedFile && $config['image']) {
                $this->storeImage($image, $item, $config['image'], $config['max_width']);
            }

            return $item->fresh();
        });
    }

    public function delete(string $type, Model $item): void
    {
        $item->delete();
    }

    /**
     * @param  list<int>  $ids
     */
    public function reorder(string $type, array $ids): void
    {
        $model = ContentTypes::config($type)['model'];

        DB::transaction(function () use ($model, $ids) {
            foreach (array_values($ids) as $index => $id) {
                $model::query()->whereKey($id)->update(['sort_order' => $index + 1]);
            }
        });

        CacheVersion::bump('content');
    }

    /**
     * @return array<string, mixed>
     */
    public function setting(string $key): array
    {
        $value = SiteSetting::query()->where('key', $key)->value('value');
        $value = is_array($value) ? $value : (is_string($value) ? (json_decode($value, true) ?: []) : []);

        if ($key === 'social_links' && array_is_list($value)) {
            $value = ['links' => $value];
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function saveSetting(string $key, array $data, ?UploadedFile $image): array
    {
        $current = $this->setting($key);
        $value = array_merge($current, array_intersect_key($data, array_flip(self::SETTINGS[$key])));

        if ($key === 'social_links') {
            $value = array_values($value['links'] ?? []);
        }

        $setting = SiteSetting::query()->updateOrCreate(['key' => $key], ['value' => $value]);

        $imageField = match ($key) {
            'hero' => 'banner_image',
            'promo_card', 'interview_section', 'quick_apply_section' => 'image',
            default => null,
        };

        if ($image && $imageField) {
            $this->storeImage($image, $setting, 'value->'.$imageField, 2000);
        }

        CacheVersion::bump('content');

        return $this->setting($key);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function saveEntity(Entity $entity, array $data, ?UploadedFile $logo, ?UploadedFile $pattern, ?UploadedFile $photo = null): Entity
    {
        $entity->fill(array_intersect_key($data, array_flip(['name', 'motto', 'short_description', 'primary_color', 'secondary_color', 'accent_color', 'website_url', 'sort_order', 'is_active'])))->save();
        CacheVersion::bump('jobs');

        if ($logo) {
            $this->storeImage($logo, $entity, 'logo_path', 400);
        }

        if ($pattern) {
            $this->storeImage($pattern, $entity, 'pattern_path', 1600);
        }

        if ($photo) {
            $this->storeImage($photo, $entity, 'photo_path', 1600);
        }

        CacheVersion::bump('content');

        return $entity->fresh();
    }

    /**
     * Everything the landing page needs, cached until content changes.
     *
     * @return array<string, mixed>
     */
    public function publicPayload(): array
    {
        $version = CacheVersion::get('content');

        return Cache::remember('content:v'.$version.':public', now()->addHour(), fn () => $this->buildPublicPayload());
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPublicPayload(): array
    {
        $url = fn (?string $path) => ImageService::url($path);
        $hero = $this->setting('hero');
        $promo = $this->setting('promo_card');
        $numbers = array_filter($this->setting('company_numbers'), fn ($value) => filled($value) && (int) $value > 0);

        return [
            'hero' => [
                'eyebrow' => filled($hero['eyebrow'] ?? null) ? $hero['eyebrow'] : null,
                'title' => filled($hero['title'] ?? null) ? $hero['title'] : 'Infolks Group',
                'motto' => $hero['motto'] ?? 'A company with a heart',
                'company_line' => $hero['company_line'] ?? null,
                'banner_image' => $url($hero['banner_image'] ?? null),
            ],
            'sections' => $this->sectionText($url),
            'company_numbers' => $numbers === [] ? null : array_map('intval', $numbers),
            'about' => [
                'title' => $this->setting('about_intro')['title'] ?? 'About the group',
                'intro' => $this->setting('about_intro')['intro'] ?? null,
                'blocks' => AboutBlock::query()->published()->ordered()->get(['id', 'title', 'body', 'heroicon_name'])->toArray(),
            ],
            'interview_steps' => InterviewStep::query()->published()->ordered()->get(['id', 'name', 'description'])->toArray(),
            'stories' => EmployeeStory::query()->published()->ordered()->with('entity:id,name,slug')->get()->map(fn (EmployeeStory $story) => [
                'id' => $story->id,
                'name' => $story->name,
                'role' => $story->role,
                'entity' => $story->entity?->name,
                'photo_url' => $url($story->photo_path),
                'quote' => $story->quote,
            ])->values()->all(),
            'drives' => RecruitmentDrive::query()->published()->ordered()->get()
                ->filter(fn (RecruitmentDrive $drive) => $url($drive->photo_path) !== null)
                ->map(fn (RecruitmentDrive $drive) => [
                    'id' => $drive->id,
                    'name' => $drive->name,
                    'date' => $drive->drive_date?->toDateString(),
                    'caption' => $drive->caption,
                    'photo_url' => $url($drive->photo_path),
                ])->values()->all(),
            'media' => MediaItem::query()->published()->ordered()->get()->map(fn (MediaItem $item) => [
                'id' => $item->id,
                'type' => $item->type?->value ?? $item->type,
                'title' => $item->title,
                'youtube_id' => $this->youtubeId($item->youtube_url),
                'photo_url' => $url($item->photo_path),
                'caption' => $item->caption,
            ])->filter(fn ($item) => $item['youtube_id'] || $item['photo_url'])->values()->all(),
            'faqs' => Faq::query()->published()->ordered()->get(['id', 'question', 'answer'])->toArray(),
            'recognitions' => Recognition::query()->published()->ordered()->get()->map(fn (Recognition $badge) => [
                'id' => $badge->id,
                'name' => $badge->name,
                'year' => $badge->year,
                'link' => $badge->link,
                'badge_url' => $url($badge->badge_path),
            ])->filter(fn ($badge) => $badge['badge_url'])->values()->all(),
            'social_links' => array_values(array_filter($this->setting('social_links')['links'] ?? [], fn ($link) => filled($link['url'] ?? null))),
            'footer' => $this->setting('footer'),
            'quick_apply_confirmation' => $this->setting('quick_apply_confirmation_text'),
            'promo_card' => [
                'headline' => $promo['headline'] ?? null,
                'tagline' => $promo['tagline'] ?? null,
                'image' => $url($promo['image'] ?? null),
            ],
            'entities' => Entity::query()->where('is_active', true)->orderBy('sort_order')->get()->map(fn (Entity $entity) => [
                'name' => $entity->name,
                'slug' => $entity->slug,
                'motto' => $entity->motto,
                'description' => $entity->short_description,
                'website_url' => $entity->website_url,
                'theme' => $entity->theme,
            ])->values()->all(),
        ];
    }

    /**
     * Headings, intros and photos for the landing page sections, with the career page copy as defaults.
     *
     * @param  callable(?string): ?string  $url
     * @return array<string, array<string, mixed>>
     */
    private function sectionText(callable $url): array
    {
        $entities = $this->setting('entities_section');
        $interview = $this->setting('interview_section');
        $quickApply = $this->setting('quick_apply_section');
        $faq = $this->setting('faq_section');

        return [
            'entities' => [
                'title' => $entities['title'] ?? 'Our story has more than one way in',
                'intro' => $entities['intro'] ?? null,
            ],
            'interview' => [
                'eyebrow' => $interview['eyebrow'] ?? 'How we hire',
                'title' => $interview['title'] ?? 'Our Recruitment Process',
                'image' => $url($interview['image'] ?? null),
            ],
            'quick_apply' => [
                'title' => $quickApply['title'] ?? 'Your story could begin here',
                'intro' => $quickApply['intro'] ?? null,
                'image' => $url($quickApply['image'] ?? null),
            ],
            'faq' => [
                'title' => $faq['title'] ?? 'A few things you might want to know',
            ],
        ];
    }

    private function storeImage(UploadedFile $file, Model $model, string $column, int $maxWidth): void
    {
        try {
            $this->images->save($file, $model, $column, $maxWidth);
        } catch (Throwable $exception) {
            throw ValidationException::withMessages(['image' => $exception->getMessage()]);
        }
    }

    private function youtubeId(?string $url): ?string
    {
        if (blank($url)) {
            return null;
        }

        return preg_match('#(?:youtu\.be/|v=|embed/|shorts/)([\w-]{6,})#', $url, $matches) ? $matches[1] : null;
    }
}
