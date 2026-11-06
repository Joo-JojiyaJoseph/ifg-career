<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EntityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'motto' => $this->motto,
            'short_description' => $this->short_description,
            'website_url' => $this->website_url,
            'theme' => $this->theme,
            'sort_order' => $this->sort_order,
        ];
    }
}
