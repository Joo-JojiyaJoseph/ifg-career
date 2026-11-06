<?php

namespace App\Support;

use App\Models\AboutBlock;
use App\Models\EmployeeStory;
use App\Models\Faq;
use App\Models\InterviewStep;
use App\Models\MediaItem;
use App\Models\Recognition;
use App\Models\RecruitmentDrive;
use App\Rules\VirusFree;
use Illuminate\Validation\Rule;

/**
 * The list-style website content sections HR edits in the portal, with their validation rules.
 */
class ContentTypes
{
    /**
     * @var array<string, array{model: class-string, image: ?string, image_required: bool, html: ?string, max_width: int}>
     */
    public const TYPES = [
        'about-blocks' => ['model' => AboutBlock::class, 'image' => null, 'image_required' => false, 'html' => null, 'max_width' => 0],
        'interview-steps' => ['model' => InterviewStep::class, 'image' => null, 'image_required' => false, 'html' => null, 'max_width' => 0],
        'employee-stories' => ['model' => EmployeeStory::class, 'image' => 'photo_path', 'image_required' => false, 'html' => null, 'max_width' => 480],
        'recruitment-drives' => ['model' => RecruitmentDrive::class, 'image' => 'photo_path', 'image_required' => true, 'html' => null, 'max_width' => 1600],
        'faqs' => ['model' => Faq::class, 'image' => null, 'image_required' => false, 'html' => 'answer', 'max_width' => 0],
        'recognitions' => ['model' => Recognition::class, 'image' => 'badge_path', 'image_required' => true, 'html' => null, 'max_width' => 400],
        'media-items' => ['model' => MediaItem::class, 'image' => 'photo_path', 'image_required' => false, 'html' => null, 'max_width' => 1600],
    ];

    public const PATTERN = 'about-blocks|interview-steps|employee-stories|recruitment-drives|faqs|recognitions|media-items';

    /**
     * @return array{model: class-string, image: ?string, image_required: bool, html: ?string, max_width: int}
     */
    public static function config(string $type): array
    {
        return self::TYPES[$type] ?? abort(404);
    }

    /**
     * @return array<string, mixed>
     */
    public static function rules(string $type, bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';
        $config = self::config($type);
        $imageMimes = $type === 'recognitions' ? 'mimes:jpg,jpeg,png,webp,svg' : 'mimes:jpg,jpeg,png,webp';

        $common = [
            'is_published' => ['sometimes', 'boolean'],
            'image' => array_values(array_filter([
                $creating && $config['image_required'] ? 'required' : 'nullable',
                'file',
                $imageMimes,
                'max:3072',
                new VirusFree,
            ])),
        ];

        return array_merge($common, match ($type) {
            'about-blocks' => [
                'title' => [$required, 'string', 'max:80'],
                'body' => [$required, 'string', 'max:600'],
                'heroicon_name' => [$required, 'string', 'max:60', 'regex:/^[A-Z][A-Za-z0-9]+Icon$/'],
            ],
            'interview-steps' => [
                'name' => [$required, 'string', 'max:80'],
                'description' => [$required, 'string', 'max:255'],
            ],
            'employee-stories' => [
                'name' => [$required, 'string', 'max:100'],
                'role' => [$required, 'string', 'max:100'],
                'entity' => ['nullable', 'string', Rule::exists('entities', 'slug')],
                'quote' => [$required, 'string', 'max:600'],
                'publish_permission_confirmed' => ['sometimes', 'boolean'],
                'is_published' => ['sometimes', 'boolean', 'declined_if:publish_permission_confirmed,false'],
            ],
            'recruitment-drives' => [
                'name' => [$required, 'string', 'max:150'],
                'drive_date' => [$required, 'date', 'before_or_equal:today'],
                'caption' => ['nullable', 'string', 'max:255'],
            ],
            'faqs' => [
                'question' => [$required, 'string', 'max:255'],
                'answer' => [$required, 'string', 'max:5000'],
            ],
            'recognitions' => [
                'name' => [$required, 'string', 'max:150'],
                'year' => ['nullable', 'integer', 'min:1950', 'max:'.(now()->year + 1)],
                'link' => ['nullable', 'url:https,http', 'max:255'],
            ],
            'media-items' => [
                'type' => [$required, Rule::in(['video', 'activity'])],
                'title' => [$required, 'string', 'max:150'],
                'youtube_url' => ['nullable', 'required_if:type,video', 'url:https', 'max:255', 'regex:#^https://(www\.)?(youtube\.com/(watch\?v=|embed/|shorts/)|youtu\.be/)[\w-]{6,}#'],
                'caption' => ['nullable', 'string', 'max:255'],
            ],
        });
    }
}
