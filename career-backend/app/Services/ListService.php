<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Entity;
use App\Models\Team;
use App\Support\CacheVersion;
use App\Support\ListTypes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Settings → Departments, teams & skills. Departments sit under a company (or are group-wide), teams under a
 * department, and skills are linked to companies (none = all). Items in use are deactivated, never deleted.
 */
class ListService
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function list(string $type, ?string $term, ?string $entitySlug): Collection
    {
        $model = ListTypes::model($type);
        $entityId = $entitySlug ? Entity::query()->where('slug', $entitySlug)->value('id') : null;
        $query = $model::query()->orderBy('name')->withCount('jobPostings');

        if ($term) {
            $query->where('name', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%');
        }

        match ($type) {
            'departments' => $query->with('entity:id,name,slug')->when($entitySlug, fn ($q) => $q->forEntity($entityId)),
            'teams' => $query->with('department.entity:id,name,slug')->when($entitySlug, fn ($q) => $q->whereHas('department', fn ($d) => $d->forEntity($entityId))),
            'skills' => $query->with('entities:id,name,slug')->when($entitySlug, fn ($q) => $q->where(fn ($inner) => $inner->doesntHave('entities')->orWhereHas('entities', fn ($e) => $e->whereKey($entityId)))),
            default => null,
        };

        return $query->get()->map(fn (Model $item) => $this->present($type, $item));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function save(string $type, array $data, ?Model $item = null): array
    {
        $model = ListTypes::model($type);
        $item ??= new $model(['is_active' => true]);
        $entities = $data['entities'] ?? null;
        unset($data['entities']);

        if ($type === 'departments') {
            if (array_key_exists('entity', $data)) {
                $data['entity_id'] = filled($data['entity']) ? Entity::query()->where('slug', $data['entity'])->value('id') : null;
            }
            unset($data['entity']);
            $this->assertUniqueDepartment($data['name'] ?? $item->name, array_key_exists('entity_id', $data) ? $data['entity_id'] : $item->entity_id, $item->id);
        }

        if ($type === 'teams') {
            $departmentId = array_key_exists('department_id', $data) ? $data['department_id'] : $item->department_id;
            $taken = Team::query()->where('name', $data['name'] ?? $item->name)->where('department_id', $departmentId)->when($item->id, fn ($q) => $q->whereKeyNot($item->id))->exists();
            if ($taken) {
                throw ValidationException::withMessages(['name' => 'This department already has a team with this name.']);
            }
        }

        $item->fill($data)->save();

        if ($type === 'skills' && $entities !== null) {
            $item->entities()->sync(Entity::query()->whereIn('slug', $entities)->pluck('id'));
        }

        CacheVersion::bump('content');

        return $this->present($type, $item->fresh()->loadCount('jobPostings')->load(match ($type) {
            'departments' => ['entity'],
            'teams' => ['department.entity'],
            default => ['entities'],
        }));
    }

    public function delete(Model $item): void
    {
        $item->loadCount('jobPostings');
        if ($item->job_postings_count > 0) {
            throw ValidationException::withMessages(['item' => 'This is used by '.$item->job_postings_count.' jobs. Deactivate it instead, so those jobs keep their history.']);
        }

        $item->delete();
        CacheVersion::bump('content');
    }

    /** Department names are unique within a company (and within the group-wide set). */
    private function assertUniqueDepartment(?string $name, ?int $entityId, ?int $ignoreId): void
    {
        $taken = Department::query()
            ->where('name', $name)
            ->when($entityId, fn ($q) => $q->where('entity_id', $entityId), fn ($q) => $q->whereNull('entity_id'))
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->exists();

        if ($taken) {
            throw ValidationException::withMessages(['name' => $entityId ? 'This company already has a department with this name.' : 'There is already a group-wide department with this name.']);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function present(string $type, Model $item): array
    {
        $entity = fn (?Entity $entity) => $entity ? ['slug' => $entity->slug, 'name' => $entity->name] : null;

        return [
            'id' => $item->id,
            'name' => $item->name,
            'slug' => $item->slug ?? null,
            'is_active' => (bool) $item->is_active,
            'usage' => (int) ($item->job_postings_count ?? 0),
            'department_id' => $item->department_id ?? null,
            'department' => $type === 'teams' ? $item->department?->name : null,
            'entity' => match ($type) {
                'departments' => $entity($item->entity),
                'teams' => $entity($item->department?->entity),
                default => null,
            },
            'entities' => $type === 'skills' ? $item->entities->map(fn (Entity $e) => $entity($e))->values()->all() : null,
        ];
    }
}
