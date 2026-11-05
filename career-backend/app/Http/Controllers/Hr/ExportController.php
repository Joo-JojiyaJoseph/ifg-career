<?php

namespace App\Http\Controllers\Hr;

use App\Enums\ExportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hr\StoreExportRequest;
use App\Http\Resources\ExportResource;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\Export;
use App\Services\ExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Export::class);

        $exports = Export::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(20)
            ->get();

        return ExportResource::collection($exports)->response();
    }

    public function store(StoreExportRequest $request, ExportService $exports): JsonResponse
    {
        $type = $request->validated('type');
        $this->authorize($type === 'applications' ? 'viewAny' : 'export', $type === 'applications' ? Application::class : Candidate::class);

        $export = $exports->queue($request->user(), $type, $request->exportFilters());

        return (new ExportResource($export))->response()->setStatusCode(202);
    }

    public function show(Request $request, Export $export): ExportResource
    {
        $this->authorize('view', $export);
        $this->owned($request, $export);

        return new ExportResource($export);
    }

    public function download(Request $request, Export $export): StreamedResponse
    {
        $this->authorize('view', $export);
        $this->owned($request, $export);

        if ($export->status !== ExportStatus::Ready || blank($export->file_path) || ($export->expires_at && $export->expires_at->isPast())) {
            abort(404);
        }

        if (! Storage::disk('private')->exists($export->file_path)) {
            abort(404);
        }

        $filename = 'infolks-group-'.$export->type.'.xlsx';

        return Storage::disk('private')->download($export->file_path, $filename, [
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function owned(Request $request, Export $export): void
    {
        if ($export->user_id !== $request->user()->id && ! $request->user()->isAdmin()) {
            abort(404);
        }
    }
}
