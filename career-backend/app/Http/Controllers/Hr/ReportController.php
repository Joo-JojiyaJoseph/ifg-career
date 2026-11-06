<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => collect(ReportService::REPORTS)->map(fn ($title, $key) => ['key' => $key, 'title' => $title])->values()]);
    }

    public function show(Request $request, string $report, ReportService $reports): JsonResponse
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'entity' => ['nullable', 'string', 'max:50'],
        ]);

        return response()->json(['data' => $reports->run($report, $filters)]);
    }
}
