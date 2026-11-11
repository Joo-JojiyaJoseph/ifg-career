<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hr\ContentItemRequest;
use App\Http\Requests\Hr\EntityContentRequest;
use App\Http\Requests\Hr\SiteSettingRequest;
use App\Http\Resources\ContentItemResource;
use App\Models\Entity;
use App\Models\SiteSetting;
use App\Services\ContentService;
use App\Services\EntityService;
use App\Services\ImageService;
use App\Support\ContentTypes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Website content (landing page) management. Every list section shares one set of endpoints.
 */
class ContentController extends Controller
{
    public function index(string $type, ContentService $content): JsonResponse
    {
        $this->authorize('viewAny', ContentTypes::config($type)['model']);

        return ContentItemResource::collection($content->list($type))->response();
    }

    public function store(ContentItemRequest $request, string $type, ContentService $content): JsonResponse
    {
        $this->authorize('create', ContentTypes::config($type)['model']);

        return (new ContentItemResource($content->save($type, $request->validated() + ['image' => $request->file('image')])))
            ->response()->setStatusCode(201);
    }

    public function update(ContentItemRequest $request, string $type, int $id, ContentService $content): ContentItemResource
    {
        $item = $this->find($type, $id);
        $this->authorize('update', $item);

        return new ContentItemResource($content->save($type, $request->validated() + ['image' => $request->file('image')], $item));
    }

    public function destroy(string $type, int $id, ContentService $content): Response
    {
        $item = $this->find($type, $id);
        $this->authorize('delete', $item);
        $content->delete($type, $item);

        return response()->noContent();
    }

    public function reorder(Request $request, string $type, ContentService $content): Response
    {
        $model = ContentTypes::config($type)['model'];
        $this->authorize('update', $model);
        $ids = $request->validate(['ids' => ['required', 'array', 'max:200'], 'ids.*' => ['integer', 'distinct']])['ids'];
        $content->reorder($type, $ids);

        return response()->noContent();
    }

    public function settings(ContentService $content): JsonResponse
    {
        $this->authorize('viewAny', SiteSetting::class);

        return response()->json(['data' => collect(ContentService::SETTINGS)->keys()->mapWithKeys(function (string $key) use ($content) {
            $value = $content->setting($key);

            foreach (['banner_image', 'image'] as $field) {
                if (array_key_exists($field, $value)) {
                    $value[$field.'_url'] = ImageService::url($value[$field]);
                    $value[$field.'_processing'] = ImageService::isPending($value[$field]);
                }
            }

            return [$key => $value];
        })]);
    }

    public function updateSetting(SiteSettingRequest $request, string $key, ContentService $content): JsonResponse
    {
        $this->authorize('update', SiteSetting::class);
        $data = collect($request->validated())->except('image')->all();

        return response()->json(['data' => $content->saveSetting($key, $data, $request->file('image'))]);
    }

    public function entities(): JsonResponse
    {
        $this->authorize('viewAny', Entity::class);

        return response()->json(['data' => Entity::query()->withCount(['jobPostings', 'applications'])->orderBy('sort_order')->orderBy('name')->get()->map(fn (Entity $entity) => [
            'id' => $entity->id,
            'name' => $entity->name,
            'slug' => $entity->slug,
            'sort_order' => $entity->sort_order,
            'is_active' => $entity->is_active,
            'jobs_count' => $entity->job_postings_count,
            'applications_count' => $entity->applications_count,
            'motto' => $entity->motto,
            'short_description' => $entity->short_description,
            'primary_color' => $entity->primary_color,
            'secondary_color' => $entity->secondary_color,
            'accent_color' => $entity->accent_color,
            'website_url' => $entity->website_url,
            'theme' => $entity->theme,
        ])]);
    }

    public function updateEntity(EntityContentRequest $request, string $slug, ContentService $content): JsonResponse
    {
        $entity = Entity::query()->where('slug', $slug)->firstOrFail();
        $this->authorize('update', $entity);
        $data = collect($request->validated())->except(['logo', 'pattern', 'photo', 'slug']);
        // Renaming, hiding and reordering companies is for users who may manage companies.
        if ($request->user()->cannot('manage', Entity::class)) {
            $data = $data->except(['name', 'is_active', 'sort_order']);
        }
        $data = $data->all();
        $entity = $content->saveEntity($entity, $data, $request->file('logo'), $request->file('pattern'), $request->file('photo'));

        return response()->json(['data' => ['slug' => $entity->slug, 'theme' => $entity->theme]]);
    }

    public function storeEntity(EntityContentRequest $request, EntityService $entities): JsonResponse
    {
        $this->authorize('create', Entity::class);
        $entity = $entities->create(
            collect($request->validated())->except(['logo', 'pattern', 'photo'])->all(),
            $request->file('logo'),
            $request->file('pattern'),
            $request->file('photo'),
        );

        return response()->json(['data' => ['slug' => $entity->slug, 'name' => $entity->name, 'theme' => $entity->theme]], 201);
    }

    public function destroyEntity(string $slug, EntityService $entities): Response
    {
        $entity = Entity::query()->where('slug', $slug)->firstOrFail();
        $this->authorize('delete', $entity);
        $entities->delete($entity);

        return response()->noContent();
    }

    private function find(string $type, int $id): Model
    {
        return ContentTypes::config($type)['model']::query()->findOrFail($id);
    }
}
