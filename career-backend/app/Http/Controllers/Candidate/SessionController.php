<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Http\Resources\CandidateResource;
use App\Support\GuardSignOut;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function me(Request $request): CandidateResource
    {
        return new CandidateResource(
            $request->user('candidate')->load(['talentMember', 'preferredDepartment'])
        );
    }

    public function logout(Request $request): JsonResponse
    {
        GuardSignOut::end('candidate');

        return response()->json(['message' => 'Signed out.']);
    }
}
