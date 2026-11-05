<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforcePortalIdleTimeout
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth('web')->check()) {
            $last = session('hr.last_activity');

            if (is_string($last) && now()->diffInMinutes($last, true) >= 30) {
                auth('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return response()->json([
                    'message' => 'Your session expired. Sign in again.',
                    'code' => 'session_expired',
                ], 401);
            }

            session(['hr.last_activity' => now()->toIso8601String()]);
        }

        return $next($request);
    }
}
