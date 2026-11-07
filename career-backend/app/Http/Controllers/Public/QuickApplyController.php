<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\QuickApplyRequest;
use App\Http\Resources\CandidateApplicationResource;
use App\Services\QuickApplyService;
use App\Services\SpamProtectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class QuickApplyController extends Controller
{
    public function store(QuickApplyRequest $request, QuickApplyService $quickApply, SpamProtectionService $spam): JsonResponse
    {
        $spam->assertHuman($request);
        $result = $quickApply->submit($request->validated(), $request->file('resume'));

        // A first-time candidate is signed in straight away so Candidate profile shows this application's status.
        if ($result['created'] && $request->hasSession()) {
            Auth::guard('candidate')->login($result['candidate']);
            $request->session()->regenerate();
        }

        return response()->json([
            'message' => $result['profile_notice'] ?? $result['confirmation'],
            'confirmation' => $result['confirmation'],
            'profile_notice' => $result['profile_notice'],
            'signed_in' => $result['created'] && $request->hasSession(),
            'data' => new CandidateApplicationResource($result['application']),
        ], 201);
    }
}
