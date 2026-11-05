<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hr\SavedFilterRequest;
use App\Http\Resources\SavedFilterResource;
use App\Models\SavedFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SavedFilterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SavedFilter::class);

        $filters = SavedFilter::query()
            ->visibleTo($request->user())
            ->when($request->string('screen')->toString(), fn ($query, $screen) => $query->where('screen', $screen))
            ->orderBy('name')
            ->get();

        return SavedFilterResource::collection($filters)->response();
    }

    public function store(SavedFilterRequest $request): JsonResponse
    {
        $this->authorize('create', SavedFilter::class);

        $data = $request->validated();
        if (! empty($data['is_default'])) {
            $this->clearDefault($request, $data['screen']);
        }

        $filter = $request->user()->savedFilters()->create($data);

        return (new SavedFilterResource($filter))->response()->setStatusCode(201);
    }

    public function show(Request $request, SavedFilter $savedFilter): SavedFilterResource
    {
        $this->authorize('view', $savedFilter);

        return new SavedFilterResource($savedFilter);
    }

    public function update(SavedFilterRequest $request, SavedFilter $savedFilter): SavedFilterResource
    {
        $this->authorize('update', $savedFilter);

        $data = $request->validated();
        if (! empty($data['is_default'])) {
            $this->clearDefault($request, $data['screen'] ?? $savedFilter->screen);
        }

        $savedFilter->update($data);

        return new SavedFilterResource($savedFilter);
    }

    public function destroy(SavedFilter $savedFilter): Response
    {
        $this->authorize('delete', $savedFilter);
        $savedFilter->delete();

        return response()->noContent();
    }

    private function clearDefault(Request $request, string $screen): void
    {
        SavedFilter::query()
            ->where('user_id', $request->user()->id)
            ->where('screen', $screen)
            ->update(['is_default' => false]);
    }
}
