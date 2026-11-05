<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hr\BulkJobPostingRequest;
use App\Http\Requests\Hr\ExtendJobPostingRequest;
use App\Http\Requests\Hr\JobPostingIndexRequest;
use App\Http\Requests\Hr\JobPostingRequest;
use App\Http\Resources\JobPostingResource;
use App\Models\JobPosting;
use App\Services\JobPostingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class JobPostingController extends Controller
{
    public function index(JobPostingIndexRequest $request, JobPostingService $jobs): JsonResponse
    {
        $this->authorize('viewAny', JobPosting::class);

        $result = $jobs->hrList($request->filters(), (int) ($request->validated('per_page') ?? 25));
        $page = $result['paginator'];

        return JobPostingResource::collection($page)->additional([
            'counts' => $result['counts'],
        ])->response();
    }

    public function store(JobPostingRequest $request, JobPostingService $jobs): JsonResponse
    {
        $this->authorize('create', JobPosting::class);

        $job = $jobs->create($request->validated());

        return (new JobPostingResource($job))->response()->setStatusCode(201);
    }

    public function show(JobPosting $jobPosting): JobPostingResource
    {
        $this->authorize('view', $jobPosting);
        $jobPosting->load(['entity', 'department', 'team', 'skills', 'creator'])->loadCount('applications');

        return new JobPostingResource($jobPosting);
    }

    public function update(JobPostingRequest $request, JobPosting $jobPosting, JobPostingService $jobs): JobPostingResource
    {
        $this->authorize('update', $jobPosting);

        return new JobPostingResource($jobs->update($jobPosting, $request->validated()));
    }

    public function destroy(JobPosting $jobPosting, JobPostingService $jobs): Response
    {
        $this->authorize('delete', $jobPosting);
        $jobs->deleteDraft($jobPosting);

        return response()->noContent();
    }

    public function publish(JobPosting $jobPosting, JobPostingService $jobs): JobPostingResource
    {
        $this->authorize('publish', $jobPosting);

        return new JobPostingResource($jobs->publish($jobPosting));
    }

    public function unpublish(JobPosting $jobPosting, JobPostingService $jobs): JobPostingResource
    {
        $this->authorize('publish', $jobPosting);

        return new JobPostingResource($jobs->unpublish($jobPosting));
    }

    public function close(JobPosting $jobPosting, JobPostingService $jobs): JobPostingResource
    {
        $this->authorize('publish', $jobPosting);

        return new JobPostingResource($jobs->close($jobPosting));
    }

    public function extend(ExtendJobPostingRequest $request, JobPosting $jobPosting, JobPostingService $jobs): JobPostingResource
    {
        $this->authorize('publish', $jobPosting);

        return new JobPostingResource($jobs->extend($jobPosting, $request->validated('last_date_to_apply')));
    }

    public function duplicate(JobPosting $jobPosting, JobPostingService $jobs): JsonResponse
    {
        $this->authorize('create', JobPosting::class);

        $copy = $jobs->duplicate($jobPosting);

        return (new JobPostingResource($copy))->response()->setStatusCode(201);
    }

    public function bulk(BulkJobPostingRequest $request, JobPostingService $jobs): JsonResponse
    {
        $action = $request->validated('action');
        $this->authorize($action === 'publish' || $action === 'unpublish' || $action === 'close' ? 'publish' : 'update', JobPosting::class);

        return response()->json([
            'data' => $jobs->bulk($action, $request->validated('ids')),
        ]);
    }
}
