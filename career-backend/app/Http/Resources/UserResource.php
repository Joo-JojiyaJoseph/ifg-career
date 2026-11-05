<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing(['roles', 'permissions']);

        return [
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->getRoleNames()->first(),
            'permissions' => $this->getAllPermissions()->pluck('name')->values(),
            'is_admin' => $this->isAdmin(),
            'two_factor_enabled' => $this->two_factor_confirmed_at !== null,
            'initials' => collect(preg_split('/\s+/', trim($this->name)) ?: [])
                ->filter()
                ->take(2)
                ->map(fn ($part) => mb_strtoupper(mb_substr($part, 0, 1)))
                ->implode(''),
        ];
    }
}
