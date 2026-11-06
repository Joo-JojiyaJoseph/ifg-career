<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\JobPosting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Global search for the portal top bar and the Ctrl+K palette. Results respect the user's permissions.
 */
class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $term = trim((string) $request->validate(['q' => ['required', 'string', 'min:2', 'max:100']])['q']);
        $user = $request->user();
        $groups = [];

        if ($user->can('viewAny', Candidate::class)) {
            $groups['candidates'] = Candidate::query()->search($term)->limit(6)->get(['id', 'public_id', 'name', 'email', 'avatar_url'])
                ->map(fn (Candidate $candidate) => [
                    'id' => $candidate->public_id,
                    'title' => $candidate->name,
                    'subtitle' => $candidate->email,
                    'url' => '/candidates/'.$candidate->public_id,
                ])->values();
        }

        if ($user->can('viewAny', JobPosting::class)) {
            $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';
            $groups['jobs'] = JobPosting::query()->with('entity:id,name')
                ->where(fn ($query) => $query->where('title', 'like', $like)->orWhere('location', 'like', $like))
                ->latest('id')->limit(6)->get(['id', 'public_id', 'title', 'entity_id', 'status', 'location'])
                ->map(fn (JobPosting $job) => [
                    'id' => $job->public_id,
                    'title' => $job->title,
                    'subtitle' => collect([$job->entity?->name, $job->location, $job->status?->label()])->filter()->implode(', '),
                    'url' => '/jobs/'.$job->public_id.'/edit',
                ])->values();
        }

        return response()->json(['data' => $groups]);
    }
}
