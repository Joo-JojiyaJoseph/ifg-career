<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SavedFilterResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'screen' => $this->screen,
            'name' => $this->name,
            'query' => $this->query,
            'is_default' => $this->is_default,
            'is_shared' => $this->is_shared,
            'mine' => $request->user()?->id === $this->user_id,
        ];
    }
}
