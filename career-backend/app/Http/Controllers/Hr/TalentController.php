<?php

namespace App\Http\Controllers\Hr;

use App\Enums\CampaignStatus;
use App\Filters\TalentMemberFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hr\CampaignRequest;
use App\Http\Requests\Hr\TalentMemberIndexRequest;
use App\Http\Resources\CampaignResource;
use App\Http\Resources\TalentMemberResource;
use App\Models\Campaign;
use App\Models\TalentMember;
use App\Services\CampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TalentController extends Controller
{
    public function members(TalentMemberIndexRequest $request, TalentMemberFilter $filter): JsonResponse
    {
        $this->authorize('viewAny', TalentMember::class);
        $filters = $request->filters();
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        $query = $filter->apply(TalentMember::query()->with('candidate:id,public_id,name'), $filters)
            ->orderBy(($filters['sort'] ?? 'subscribed_at') === 'name' ? 'name' : 'subscribed_at', $direction)
            ->orderBy('id');

        $base = fn (string $except) => $filter->apply(TalentMember::query(), $filters, $except);

        return TalentMemberResource::collection($query->paginate((int) ($request->validated('per_page') ?? 25))->withQueryString())
            ->additional(['counts' => [
                'subscribed' => (clone $base('subscribed'))->where('is_subscribed', true)->count(),
                'unsubscribed' => (clone $base('subscribed'))->where('is_subscribed', false)->count(),
                'source' => $base('source')->reorder()->selectRaw('source as facet_key, count(*) as total')->groupBy('source')->pluck('total', 'facet_key'),
            ]])
            ->response();
    }

    public function campaigns(Request $request, CampaignService $campaigns): JsonResponse
    {
        $this->authorize('viewAny', Campaign::class);
        $filters = $request->validate([
            'type' => ['nullable', Rule::in(['job_alert', 'company_update'])],
            'status' => ['nullable', Rule::enum(CampaignStatus::class)],
        ]);

        return CampaignResource::collection($campaigns->list($filters, 20))
            ->additional(['meta_extra' => ['subscribed' => $campaigns->recipientCount()]])
            ->response();
    }

    public function show(Campaign $campaign): CampaignResource
    {
        $this->authorize('view', $campaign);

        return new CampaignResource($campaign->load(['sender', 'jobPostings']));
    }

    public function preview(CampaignRequest $request, CampaignService $campaigns): JsonResponse
    {
        $this->authorize('create', Campaign::class);

        return response()->json(['data' => $campaigns->preview($request->validated())]);
    }

    public function store(CampaignRequest $request, CampaignService $campaigns): JsonResponse
    {
        $this->authorize('create', Campaign::class);

        return (new CampaignResource($campaigns->saveDraft($request->validated(), $request->user())))->response()->setStatusCode(201);
    }

    public function update(CampaignRequest $request, Campaign $campaign, CampaignService $campaigns): CampaignResource
    {
        $this->authorize('update', $campaign);

        return new CampaignResource($campaigns->saveDraft($request->validated(), $request->user(), $campaign));
    }

    public function send(Request $request, Campaign $campaign, CampaignService $campaigns): JsonResponse
    {
        $this->authorize('update', $campaign);

        return (new CampaignResource($campaigns->send($campaign, $request->user())))->response()->setStatusCode(202);
    }
}
