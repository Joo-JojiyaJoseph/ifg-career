<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hr\BlacklistRequest;
use App\Http\Requests\Hr\CandidateIndexRequest;
use App\Http\Requests\Hr\CandidateNoteRequest;
use App\Http\Requests\Hr\OverrideRoleBlockRequest;
use App\Http\Requests\Hr\UpdateCandidateRequest;
use App\Http\Resources\AuditActivityResource;
use App\Http\Resources\CandidateNoteResource;
use App\Http\Resources\HrCandidateResource;
use App\Http\Resources\RoleBlockResource;
use App\Models\Candidate;
use App\Models\CandidateNote;
use App\Models\RoleBlock;
use App\Services\CandidateService;
use Illuminate\Http\JsonResponse;

class CandidateController extends Controller
{
    public function index(CandidateIndexRequest $request, CandidateService $candidates): JsonResponse
    {
        $this->authorize('viewAny', Candidate::class);

        $result = $candidates->list($request->filters(), (int) ($request->validated('per_page') ?? 25));

        return HrCandidateResource::collection($result['paginator'])->additional([
            'counts' => $result['counts'],
        ])->response();
    }

    public function show(Candidate $candidate, CandidateService $candidates): HrCandidateResource
    {
        $this->authorize('view', $candidate);

        return new HrCandidateResource($candidates->show($candidate));
    }

    public function update(UpdateCandidateRequest $request, Candidate $candidate, CandidateService $candidates): HrCandidateResource
    {
        $this->authorize('update', $candidate);

        return new HrCandidateResource($candidates->updateColour($candidate, $request->validated('colour_tag')));
    }

    public function note(CandidateNoteRequest $request, Candidate $candidate, CandidateService $candidates): JsonResponse
    {
        $this->authorize('create', CandidateNote::class);

        $note = $candidates->addNote($candidate, $request->user(), $request->validated('body'));

        return (new CandidateNoteResource($note))->response()->setStatusCode(201);
    }

    public function blacklist(BlacklistRequest $request, Candidate $candidate, CandidateService $candidates): HrCandidateResource
    {
        $this->authorize('blacklist', Candidate::class);

        return new HrCandidateResource($candidates->blacklist($candidate, $request->user(), $request->validated('reason')));
    }

    public function removeBlacklist(BlacklistRequest $request, Candidate $candidate, CandidateService $candidates): HrCandidateResource
    {
        $this->authorize('blacklist', Candidate::class);

        return new HrCandidateResource($candidates->removeBlacklist($candidate, $request->user(), $request->validated('reason')));
    }

    public function overrideRoleBlock(OverrideRoleBlockRequest $request, Candidate $candidate, string $roleKey, CandidateService $candidates): RoleBlockResource
    {
        $this->authorize('update', RoleBlock::class);

        $block = $candidates->overrideRoleBlock($candidate, $roleKey, $request->user(), $request->validated('reason'));

        return new RoleBlockResource($block);
    }

    public function resume(Candidate $candidate, CandidateService $candidates): JsonResponse
    {
        $this->authorize('resume', Candidate::class);

        return response()->json([
            'data' => $candidates->resumeLinks($candidate),
        ]);
    }

    public function activity(Candidate $candidate, CandidateService $candidates): JsonResponse
    {
        $this->authorize('view', $candidate);

        return AuditActivityResource::collection($candidates->activity($candidate))->response();
    }
}
