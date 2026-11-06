<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Support\CacheVersion;
use App\Support\ListTypes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

/**
 * Settings → Lists. Items in use are deactivated rather than deleted, so history stays intact.
 */
class ListController extends Controller
{
    public function index(Request $request, string $type): JsonResponse
    {
        $model = ListTypes::model($type);
        $this->authorize('viewAny', $model);
        $term = $request->validate(['q' => ['nullable', 'string', 'max:80']])['q'] ?? null;

        $query = $model::query()->orderBy('name');

        if ($term) {
            $query->where('name', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%');
        }

        if ($type === 'teams') {
            $query->with('department:id,name');
        }

        $usage = match ($type) {
            'skills' => 'jobPostings',
            default => 'jobPostings',
        };

        return response()->json(['data' => $query->withCount($usage)->get()->map(fn (Model $item) => [
            'id' => $item->id,
            'name' => $item->name,
            'is_active' => (bool) $item->is_active,
            'department_id' => $item->department_id ?? null,
            'department' => $type === 'teams' ? $item->department?->name : null,
            'usage' => (int) $item->job_postings_count,
        ])]);
    }

    public function store(Request $request, string $type): JsonResponse
    {
        $model = ListTypes::model($type);
        $this->authorize('create', $model);
        $data = $request->validate(ListTypes::rules($type, null));
        $item = $model::query()->create($data + ['is_active' => true]);
        $this->bust();

        return response()->json(['data' => ['id' => $item->id, 'name' => $item->name, 'slug' => $item->slug ?? null, 'is_active' => true]], 201);
    }

    public function update(Request $request, string $type, int $id): JsonResponse
    {
        $model = ListTypes::model($type);
        $item = $model::query()->findOrFail($id);
        $this->authorize('update', $item);
        $item->fill($request->validate(ListTypes::rules($type, $id)))->save();
        $this->bust();

        return response()->json(['data' => ['id' => $item->id, 'name' => $item->name, 'is_active' => (bool) $item->is_active]]);
    }

    public function destroy(string $type, int $id): Response
    {
        $model = ListTypes::model($type);
        $item = $model::query()->withCount('jobPostings')->findOrFail($id);
        $this->authorize('delete', $item);

        if ($item->job_postings_count > 0) {
            throw ValidationException::withMessages(['item' => 'This is used by '.$item->job_postings_count.' jobs. Deactivate it instead, so those jobs keep their history.']);
        }

        $item->delete();
        $this->bust();

        return response()->noContent();
    }

    private function bust(): void
    {
        CacheVersion::bump('content');
    }
}
