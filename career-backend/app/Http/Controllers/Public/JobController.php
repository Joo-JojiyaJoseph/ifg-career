<?php

namespace App\Http\Controllers\Public;

use App\Enums\JobStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\JobSearchRequest;
use App\Http\Resources\PublicJobResource;
use App\Models\JobPosting;
use App\Services\JobPostingService;
use App\Support\CacheVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class JobController extends Controller
{
    public function index(JobSearchRequest $request, JobPostingService $jobs): JsonResponse
    {
        $filters = $request->filters();
        $perPage = (int) ($request->validated('per_page') ?? 12);
        $cursor = $request->validated('cursor');
        $version = CacheVersion::get('jobs');
        $key = 'jobs:v'.$version.':'.md5(json_encode([$filters, $cursor, $perPage]));

        $payload = Cache::remember($key, now()->addMinute(), function () use ($jobs, $filters, $cursor, $perPage, $request) {
            $result = $jobs->publicList($filters, $cursor, $perPage);
            $page = $result['paginator'];

            return [
                'data' => PublicJobResource::collection($page->items())->resolve($request),
                'meta' => [
                    'per_page' => $page->perPage(),
                    'next_cursor' => $page->nextCursor()?->encode(),
                    'prev_cursor' => $page->previousCursor()?->encode(),
                    'total' => $result['total'],
                ],
                'counts' => $result['counts'],
            ];
        });

        return $this->cached($request, $payload);
    }

    public function show(Request $request, JobPosting $jobPosting): JsonResponse
    {
        $open = $jobPosting->status === JobStatus::Published && $jobPosting->is_open;

        abort_unless($open || $request->hasValidSignature(), 404);

        $jobPosting->load(['entity', 'department', 'team', 'skills']);

        return $this->cached($request, [
            'data' => (new PublicJobResource($jobPosting))->resolve($request),
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function cached(Request $request, array $payload): JsonResponse
    {
        $etag = sha1(json_encode($payload));

        if (trim((string) $request->headers->get('If-None-Match'), '"') === $etag) {
            return response()->json(null, 304)->setEtag($etag);
        }

        return response()->json($payload)->setEtag($etag);
    }
}
