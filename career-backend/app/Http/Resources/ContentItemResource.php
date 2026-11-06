<?php

namespace App\Http\Resources;

use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $attributes = collect($this->resource->attributesToArray())
            ->except(['deleted_at', 'photo_path', 'badge_path'])
            ->all();

        $path = $this->resource->photo_path ?? $this->resource->badge_path ?? null;

        return $attributes + [
            'image_url' => ImageService::url($path),
            'image_processing' => is_string($path) && str_starts_with($path, ImageService::PENDING),
            'entity' => $this->resource->relationLoaded('entity') && $this->resource->entity ? [
                'name' => $this->resource->entity->name,
                'slug' => $this->resource->entity->slug,
            ] : null,
        ];
    }
}
