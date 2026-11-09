<?php

namespace App\Services;

use App\Models\Entity;
use App\Support\CacheVersion;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Adding and removing companies. Editing the details of an existing one goes through ContentService::saveEntity.
 */
class EntityService
{
    public function __construct(private ContentService $content, private ImageService $images) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?UploadedFile $logo, ?UploadedFile $pattern, ?UploadedFile $photo): Entity
    {
        $entity = new Entity([
            'name' => $data['name'],
            'slug' => filled($data['slug'] ?? null) ? $data['slug'] : $this->uniqueSlug($data['name']),
            'sort_order' => $data['sort_order'] ?? ((int) Entity::query()->max('sort_order') + 1),
            'is_active' => $data['is_active'] ?? true,
        ]);

        return $this->content->saveEntity($entity, $data, $logo, $pattern, $photo);
    }

    /**
     * Deletes a company that has no jobs, applications or stories. Anything with history should be hidden instead.
     */
    public function delete(Entity $entity): void
    {
        $jobs = $entity->jobPostings()->count();
        $applications = $entity->applications()->count();
        $stories = $entity->employeeStories()->count();

        if ($jobs + $applications + $stories > 0) {
            $parts = array_filter([
                $jobs ? "{$jobs} ".str('job')->plural($jobs) : null,
                $applications ? "{$applications} ".str('application')->plural($applications) : null,
                $stories ? "{$stories} ".str('story')->plural($stories) : null,
            ]);

            throw ValidationException::withMessages([
                'entity' => "{$entity->name} has ".implode(', ', $parts).'. Hide it instead, so that history is kept.',
            ]);
        }

        foreach (['logo_path', 'pattern_path', 'photo_path'] as $column) {
            $this->images->deleteStored($entity->{$column});
        }

        $entity->delete();
        CacheVersion::bump('content');
        CacheVersion::bump('jobs');
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'company';
        $slug = $base;
        $n = 2;

        while (Entity::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$n}";
            $n++;
        }

        return $slug;
    }
}
