<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Http\Resources\InterviewRoundResource;
use App\Models\Application;
use App\Models\InterviewRound;
use App\Services\ContentService;
use App\Services\DashboardService;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * One endpoint per dashboard widget, so every card loads (and fails) on its own.
 */
class DashboardController extends Controller
{
    public function stats(Request $request, DashboardService $dashboard): JsonResponse
    {
        return response()->json(['data' => $this->scoped($request, $dashboard)->stats()]);
    }

    public function actionItems(Request $request, DashboardService $dashboard): JsonResponse
    {
        return response()->json(['data' => $this->scoped($request, $dashboard)->actionItems(session('hr.previous_login_at'))]);
    }

    public function pipeline(Request $request, DashboardService $dashboard): JsonResponse
    {
        return response()->json(['data' => $this->scoped($request, $dashboard)->pipeline()]);
    }

    public function applicationsOverTime(Request $request, DashboardService $dashboard): JsonResponse
    {
        return response()->json(['data' => $this->scoped($request, $dashboard)->applicationsOverTime($this->range($request))]);
    }

    public function sources(Request $request, DashboardService $dashboard): JsonResponse
    {
        return response()->json(['data' => $this->scoped($request, $dashboard)->sources($this->range($request))]);
    }

    public function upcomingInterviews(Request $request, DashboardService $dashboard): JsonResponse
    {
        $this->authorize('viewAny', InterviewRound::class);

        return InterviewRoundResource::collection($this->scoped($request, $dashboard)->upcomingInterviews())->response();
    }

    public function recentCandidates(Request $request, DashboardService $dashboard): JsonResponse
    {
        $this->authorize('viewAny', Application::class);

        return response()->json(['data' => $this->scoped($request, $dashboard)->recentApplications()->map(fn (Application $application) => [
            'public_id' => $application->public_id,
            'candidate' => [
                'public_id' => $application->candidate?->public_id,
                'name' => $application->candidate?->name,
                'initials' => $application->candidate?->initials,
                'avatar_url' => $application->candidate?->avatar_url,
            ],
            'role' => $application->display_role,
            'entity' => $application->entity ? ['name' => $application->entity->name, 'slug' => $application->entity->slug, 'theme' => $application->entity->theme] : null,
            'experience' => $application->snapshot['years_experience'] ?? $application->candidate?->years_experience,
            'applied_at' => $application->applied_at?->toIso8601String(),
            'status' => InterviewRoundResource::enum($application->status),
            'result' => InterviewRoundResource::enum($application->result),
            'has_interview' => $application->interview_rounds_count > 0,
        ])->values()]);
    }

    public function promo(ContentService $content): JsonResponse
    {
        $promo = $content->setting('promo_card');

        return response()->json(['data' => [
            'headline' => $promo['headline'] ?? 'Grow your career with Infolks Group',
            'tagline' => $promo['tagline'] ?? 'Innovate • Learn • Belong',
            'image' => ImageService::url($promo['image'] ?? null),
            'careers_url' => config('app.frontend_careers_url'),
        ]]);
    }

    private function scoped(Request $request, DashboardService $dashboard): DashboardService
    {
        $entity = $request->validate(['entity' => ['nullable', 'string', 'max:50']])['entity'] ?? null;

        return $dashboard->forEntity($entity);
    }

    private function range(Request $request): string
    {
        return $request->validate(['range' => ['nullable', Rule::in(['1m', '3m', '6m', '1y'])]])['range'] ?? '1m';
    }
}
