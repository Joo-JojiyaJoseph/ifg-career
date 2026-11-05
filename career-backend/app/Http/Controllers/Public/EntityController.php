<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\EntityResource;
use App\Models\Entity;
use App\Support\CacheVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class EntityController extends Controller
{
    public function index(): JsonResponse
    {
        $version = CacheVersion::get('content');
        $payload = Cache::remember('entities:v'.$version, now()->addMinutes(10), function () {
            return EntityResource::collection(
                Entity::query()->active()->ordered()->get()
            )->resolve();
        });

        return response()->json(['data' => $payload]);
    }
}
