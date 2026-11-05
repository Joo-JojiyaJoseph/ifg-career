<?php

namespace App\Http\Controllers\Hr;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hr\ApplicationIndexRequest;
use App\Http\Requests\Hr\AssignApplicationJobRequest;
use App\Http\Requests\Hr\BulkApplicationStatusRequest;
use App\Http\Requests\Hr\UpdateApplicationStatusRequest;
use App\Http\Resources\HrApplicationResource;
use App\Models\Application;
use App\Services\HrApplicationService;
use Illuminate\Http\JsonResponse;

class ApplicationController extends Controller
{
    public function index(ApplicationIndexRequest $request, HrApplicationService $applications): JsonResponse
    {
        $this->authorize('viewAny', Application::class);

        $result = $applications->list($request->filters(), (int) ($request->validated('per_page') ?? 25));

        return HrApplicationResource::collection($result['paginator'])->additional([
            'counts' => $result['counts'],
        ])->response();
    }

    public function updateStatus(UpdateApplicationStatusRequest $request, Application $application, HrApplicationService $applications): HrApplicationResource
    {
        $this->authorize('update', $application);

        return new HrApplicationResource(
            $applications->changeStatus($application, ApplicationStatus::from($request->validated('status'))),
        );
    }

    public function bulkStatus(BulkApplicationStatusRequest $request, HrApplicationService $applications): JsonResponse
    {
        $this->authorize('update', Application::class);

        return response()->json([
            'data' => $applications->bulkStatus(
                $request->validated('ids'),
                ApplicationStatus::from($request->validated('status')),
            ),
        ]);
    }

    public function undoStatus(Application $application, HrApplicationService $applications): HrApplicationResource
    {
        $this->authorize('update', $application);

        return new HrApplicationResource($applications->undoStatus($application, request()->user()));
    }

    public function assignJob(AssignApplicationJobRequest $request, Application $application, HrApplicationService $applications): HrApplicationResource
    {
        $this->authorize('update', $application);

        return new HrApplicationResource($applications->assignJob($application, $request->validated('job')));
    }
}
