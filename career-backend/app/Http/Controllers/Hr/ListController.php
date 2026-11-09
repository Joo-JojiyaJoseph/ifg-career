<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Services\ListService;
use App\Support\ListTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Settings → Departments, teams & skills. See ListService for the company rules.
 */
class ListController extends Controller
{
    public function __construct(private readonly ListService $lists) {}

    public function index(Request $request, string $type): JsonResponse
    {
        $this->authorize('viewAny', ListTypes::model($type));
        $input = $request->validate(['q' => ['nullable', 'string', 'max:80'], 'entity' => ['nullable', 'string', 'max:50']]);

        return response()->json(['data' => $this->lists->list($type, $input['q'] ?? null, $input['entity'] ?? null)]);
    }

    public function store(Request $request, string $type): JsonResponse
    {
        $this->authorize('create', ListTypes::model($type));

        return response()->json(['data' => $this->lists->save($type, $request->validate(ListTypes::rules($type, null)))], 201);
    }

    public function update(Request $request, string $type, int $id): JsonResponse
    {
        $item = ListTypes::model($type)::query()->findOrFail($id);
        $this->authorize('update', $item);

        return response()->json(['data' => $this->lists->save($type, $request->validate(ListTypes::rules($type, $id)), $item)]);
    }

    public function destroy(string $type, int $id): Response
    {
        $item = ListTypes::model($type)::query()->findOrFail($id);
        $this->authorize('delete', $item);
        $this->lists->delete($item);

        return response()->noContent();
    }
}
