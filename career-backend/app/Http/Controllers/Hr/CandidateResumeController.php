<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CandidateResumeController extends Controller
{
    public function file(Request $request, Candidate $candidate): StreamedResponse
    {
        $path = $candidate->resume_path;

        if (blank($path) || ! Storage::disk('private')->exists($path)) {
            abort(404);
        }

        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mime = $extension === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        $download = $request->query('disposition') === 'attachment' || $extension !== 'pdf';
        $filename = $candidate->resume_original_name ?: ('resume.'.$extension);
        $filename = str_replace(['"', '\\', "\r", "\n"], '', $filename);

        return Storage::disk('private')->response($path, $filename, [
            'Content-Type' => $mime,
            'Content-Disposition' => ($download ? 'attachment' : 'inline').'; filename="'.$filename.'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
