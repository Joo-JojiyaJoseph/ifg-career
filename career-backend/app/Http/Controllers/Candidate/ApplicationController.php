<?php

namespace App\Http\Controllers\Candidate;

use App\Filters\ApplicationFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\ApplicationIndexRequest;
use App\Http\Requests\Candidate\ApplyRequest;
use App\Http\Resources\CandidateApplicationDetailResource;
use App\Http\Resources\CandidateApplicationResource;
use App\Models\JobPosting;
use App\Services\ApplicationEligibilityService;
use App\Services\ApplicationService;
use App\Services\CandidateApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function index(ApplicationIndexRequest $request): JsonResponse
    {
        $candidate = $request->user('candidate');
        $filter = new ApplicationFilter($request->filters());
        $perPage = (int) ($request->validated('per_page') ?? 10);

        $page = $filter->apply($candidate->applications()->getQuery())
            ->with(['entity', 'jobPosting', 'department'])
            ->withExists('scheduledRounds as has_scheduled_round')
            ->latest('applied_at')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'data' => CandidateApplicationResource::collection($page->items())->resolve($request),
            'meta' => [
                'total' => $page->total(),
                'per_page' => $page->perPage(),
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
            ],
            'counts' => $filter->counts($candidate->applications()->getQuery()),
        ]);
    }

    /** One of the signed-in candidate's own applications, with its progress and interviews. */
    public function show(Request $request, string $application, CandidateApplicationService $applications): CandidateApplicationDetailResource
    {
        return new CandidateApplicationDetailResource($applications->find($request->user('candidate'), $application));
    }

    public function eligibility(Request $request, JobPosting $jobPosting, ApplicationEligibilityService $eligibility): JsonResponse
    {
        return response()->json([
            'data' => $eligibility->forJob($request->user('candidate'), $jobPosting),
        ]);
    }

    public function apply(ApplyRequest $request, JobPosting $jobPosting, ApplicationService $applications): JsonResponse
    {
        $application = $applications->apply(
            $request->user('candidate'),
            $jobPosting,
            $request->validated(),
            $request->file('resume'),
        );

        $application->setAttribute('has_scheduled_round', false);

        return response()->json([
            'message' => 'We received your application for '.$jobPosting->title.' at '.($jobPosting->entity?->name ?: 'Infolks Group').'.',
            'data' => new CandidateApplicationResource($application),
        ], 201);
    }
}
