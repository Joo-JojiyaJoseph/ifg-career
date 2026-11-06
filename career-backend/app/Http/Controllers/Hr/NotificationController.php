<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hr\NotificationIndexRequest;
use App\Http\Requests\Hr\NotificationPreferencesRequest;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationCentre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Every HR user can only ever read and change their own notifications, so no extra policy is needed.
 */
class NotificationController extends Controller
{
    public function index(NotificationIndexRequest $request, NotificationCentre $centre): JsonResponse
    {
        return NotificationResource::collection($centre->list($request->user(), $request->validated()))
            ->additional(['counts' => $centre->counts($request->user())])
            ->response();
    }

    public function unreadCount(Request $request, NotificationCentre $centre): JsonResponse
    {
        $latest = $request->user()->unreadNotifications()->latest()->limit(8)->get();

        return response()->json([
            'data' => [
                'unread' => $centre->counts($request->user())['unread'],
                'latest' => NotificationResource::collection($latest)->resolve(),
            ],
        ]);
    }

    public function read(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->whereKey($id)->firstOrFail();
        $notification->markAsRead();

        return response()->json(['data' => (new NotificationResource($notification))->resolve()]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $updated = $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['data' => ['updated' => $updated]]);
    }

    public function preferences(Request $request, NotificationCentre $centre): JsonResponse
    {
        return response()->json(['data' => $centre->preferences($request->user())]);
    }

    public function updatePreferences(NotificationPreferencesRequest $request, NotificationCentre $centre): JsonResponse
    {
        $centre->savePreferences($request->user(), $request->validated('preferences'));

        return response()->json(['data' => $centre->preferences($request->user()->fresh())]);
    }
}
