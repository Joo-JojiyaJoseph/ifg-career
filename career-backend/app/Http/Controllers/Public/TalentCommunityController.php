<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\TalentSignupRequest;
use App\Services\SpamProtectionService;
use App\Services\TalentSignupService;
use Illuminate\Http\JsonResponse;

class TalentCommunityController extends Controller
{
    public function store(TalentSignupRequest $request, TalentSignupService $signups, SpamProtectionService $spam): JsonResponse
    {
        $spam->assertHuman($request);

        return response()->json($signups->join($request->validated()));
    }
}
