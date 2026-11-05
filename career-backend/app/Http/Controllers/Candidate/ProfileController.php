<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\ResumeUploadRequest;
use App\Http\Requests\Candidate\UpdateProfileRequest;
use App\Http\Resources\CandidateResource;
use App\Services\FileStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfileController extends Controller
{
    public function show(Request $request): CandidateResource
    {
        return new CandidateResource(
            $request->user('candidate')->load(['talentMember', 'preferredDepartment'])
        );
    }

    public function update(UpdateProfileRequest $request): CandidateResource
    {
        $candidate = $request->user('candidate');
        $candidate->fill($request->validated())->save();

        return new CandidateResource($candidate->fresh()->load(['talentMember', 'preferredDepartment']));
    }

    public function uploadResume(ResumeUploadRequest $request, FileStorageService $files): CandidateResource
    {
        $candidate = $request->user('candidate');
        $file = $request->file('resume');
        $candidate->forceFill([
            'resume_path' => $files->storeResume($file),
            'resume_original_name' => $files->originalName($file),
            'resume_uploaded_at' => now(),
        ])->save();

        return new CandidateResource($candidate->fresh()->load(['talentMember', 'preferredDepartment']));
    }

    public function resume(Request $request): StreamedResponse
    {
        $candidate = $request->user('candidate');
        $path = $candidate->resume_path;

        abort_unless(filled($path) && Storage::disk('private')->exists($path), 404);

        return Storage::disk('private')->response($path, $candidate->resume_original_name ?: 'resume', [
            'Content-Disposition' => 'inline; filename="'.str_replace('"', '', $candidate->resume_original_name ?: 'resume').'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
