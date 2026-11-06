<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\ContentService;
use App\Support\CacheVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function __invoke(Request $request, ContentService $content): JsonResponse
    {
        $etag = '"content-'.CacheVersion::get('content').'"';

        if ($request->headers->get('If-None-Match') === $etag) {
            return response()->json(null, 304)->setEtag(trim($etag, '"'));
        }

        return response()->json(['data' => $content->publicPayload()])
            ->setEtag(trim($etag, '"'))
            ->setPublic()
            ->setMaxAge(300);
    }
}
