<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);
        $filters = $request->validate([
            'user' => ['nullable', 'integer'],
            'action' => ['nullable', 'string', 'max:60'],
            'type' => ['nullable', 'string', 'max:60'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $page = AuditLog::query()->with('user:id,name')
            ->when($filters['user'] ?? null, fn ($query, $user) => $query->where('user_id', $user))
            ->when($filters['action'] ?? null, fn ($query, $action) => $query->where('action', 'like', '%'.$action.'%'))
            ->when($filters['type'] ?? null, fn ($query, $type) => $query->where('auditable_type', 'like', '%'.$type))
            ->when($filters['from'] ?? null, fn ($query, $from) => $query->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($query, $to) => $query->whereDate('created_at', '<=', $to))
            ->latest('id')
            ->paginate(50)
            ->withQueryString();

        $actions = AuditLog::query()->distinct()->orderBy('action')->limit(200)->pluck('action');

        return response()->json([
            'data' => collect($page->items())->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'subject' => class_basename((string) $log->auditable_type).($log->auditable_id ? ' #'.$log->auditable_id : ''),
                'user' => $log->user?->name ?? 'System',
                'changes' => $this->changes($log),
                'ip' => $log->ip,
                'created_at' => $log->created_at?->toIso8601String(),
            ]),
            'meta' => ['total' => $page->total(), 'current_page' => $page->currentPage(), 'last_page' => $page->lastPage()],
            'actions' => $actions,
        ]);
    }

    /**
     * Field names that changed, without values: the log must not become another copy of personal data.
     *
     * @return list<string>
     */
    private function changes(AuditLog $log): array
    {
        $old = (array) ($log->old_values ?? []);
        $new = (array) ($log->new_values ?? []);
        $keys = array_unique(array_merge(array_keys($old), array_keys($new)));

        return array_values(array_filter($keys, fn ($key) => ! in_array($key, ['updated_at', 'created_at'], true) && ($old[$key] ?? null) !== ($new[$key] ?? null)));
    }
}
