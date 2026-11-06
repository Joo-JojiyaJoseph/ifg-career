<?php

namespace App\Http\Controllers\Hr;

use App\Enums\ApplicationResult;
use App\Enums\RoundStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hr\InterviewIndexRequest;
use App\Http\Requests\Hr\InterviewPipelineRequest;
use App\Http\Requests\Hr\InterviewRoundRequest;
use App\Http\Requests\Hr\UpdateApplicationResultRequest;
use App\Http\Requests\Hr\UpdateRoundStatusRequest;
use App\Http\Resources\InterviewApplicationResource;
use App\Http\Resources\InterviewRoundResource;
use App\Models\Application;
use App\Models\InterviewRound;
use App\Services\InterviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class InterviewController extends Controller
{
    public function index(InterviewIndexRequest $request, InterviewService $interviews): JsonResponse
    {
        $this->authorize('viewAny', InterviewRound::class);

        if ($request->validated('view') === 'calendar') {
            return InterviewRoundResource::collection($interviews->calendar($request->filters()))->response();
        }

        $result = $interviews->listRounds($request->filters(), (int) ($request->validated('per_page') ?? 25));

        return InterviewRoundResource::collection($result['paginator'])->additional(['counts' => $result['counts']])->response();
    }

    public function pipeline(InterviewPipelineRequest $request, InterviewService $interviews): JsonResponse
    {
        $this->authorize('viewAny', InterviewRound::class);

        $result = $interviews->listApplications($request->filters(), (int) ($request->validated('per_page') ?? 25));

        return InterviewApplicationResource::collection($result['paginator'])->additional(['counts' => $result['counts']])->response();
    }

    public function store(InterviewRoundRequest $request, Application $application, InterviewService $interviews): JsonResponse
    {
        $this->authorize('create', InterviewRound::class);

        $result = $interviews->schedule($application, $request->validated(), $request->user());

        return (new InterviewRoundResource($result['round']))->additional(['warnings' => $result['warnings']])->response()->setStatusCode(201);
    }

    public function update(InterviewRoundRequest $request, InterviewRound $round, InterviewService $interviews): JsonResponse
    {
        $this->authorize('update', $round);

        $result = $interviews->update($round, $request->validated());

        return (new InterviewRoundResource($result['round']))->additional(['warnings' => $result['warnings']])->response();
    }

    public function destroy(InterviewRound $round, InterviewService $interviews): Response
    {
        $this->authorize('delete', $round);

        $interviews->cancel($round);

        return response()->noContent();
    }

    public function status(UpdateRoundStatusRequest $request, InterviewRound $round, InterviewService $interviews): InterviewRoundResource
    {
        $this->authorize('update', $round);

        return new InterviewRoundResource($interviews->changeStatus(
            $round,
            RoundStatus::from($request->validated('status')),
            $request->validated('feedback'),
        ));
    }

    public function retrySync(InterviewRound $round, InterviewService $interviews): InterviewRoundResource
    {
        $this->authorize('update', $round);

        return new InterviewRoundResource($interviews->retrySync($round));
    }

    public function result(UpdateApplicationResultRequest $request, Application $application, InterviewService $interviews): InterviewApplicationResource
    {
        $this->authorize('update', $application);
        $this->authorize('update', InterviewRound::class);

        return new InterviewApplicationResource($interviews->setResult($application, ApplicationResult::from($request->validated('result'))));
    }
}
