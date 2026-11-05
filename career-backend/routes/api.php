<?php

use App\Http\Controllers\Candidate\ApplicationController as CandidateApplicationController;
use App\Http\Controllers\Candidate\ProfileController;
use App\Http\Controllers\Candidate\SessionController;
use App\Http\Controllers\Candidate\SubscriptionController;
use App\Http\Controllers\Hr\ApplicationController as HrApplicationController;
use App\Http\Controllers\Hr\AuthController;
use App\Http\Controllers\Hr\CandidateController;
use App\Http\Controllers\Hr\CandidateResumeController;
use App\Http\Controllers\Hr\ExportController;
use App\Http\Controllers\Hr\JobPostingController;
use App\Http\Controllers\Hr\SavedFilterController;
use App\Http\Controllers\Public\EntityController;
use App\Http\Controllers\Public\JobController;
use App\Http\Controllers\Public\MetaController;
use App\Http\Controllers\Public\QuickApplyController;
use App\Http\Controllers\Public\TalentCommunityController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:public')->group(function () {
    Route::get('public/meta', MetaController::class);
    Route::get('public/entities', [EntityController::class, 'index']);
    Route::get('public/jobs', [JobController::class, 'index']);
    Route::get('public/jobs/{jobPosting}', [JobController::class, 'show'])->name('public.jobs.show');
    Route::post('public/quick-apply', [QuickApplyController::class, 'store'])->middleware('throttle:apply');
    Route::post('public/talent-community', [TalentCommunityController::class, 'store'])->middleware('throttle:apply');
});

Route::get('hr/candidates/{candidate}/resume/file', [CandidateResumeController::class, 'file'])
    ->middleware('signed')
    ->name('hr.candidates.resume.file');

Route::prefix('hr')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:hr-login');
    Route::post('two-factor/setup', [AuthController::class, 'setup'])->middleware('throttle:hr-login');
    Route::post('two-factor/confirm', [AuthController::class, 'confirm'])->middleware('throttle:hr-login');
    Route::post('two-factor/challenge', [AuthController::class, 'challenge'])->middleware('throttle:hr-login');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:hr-login');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:hr-login');

    Route::middleware(['auth:web', 'active', 'idle'])->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('meta', MetaController::class);

        Route::get('saved-filters', [SavedFilterController::class, 'index']);
        Route::post('saved-filters', [SavedFilterController::class, 'store']);
        Route::get('saved-filters/{savedFilter}', [SavedFilterController::class, 'show']);
        Route::match(['put', 'patch'], 'saved-filters/{savedFilter}', [SavedFilterController::class, 'update']);
        Route::delete('saved-filters/{savedFilter}', [SavedFilterController::class, 'destroy']);

        Route::post('job-postings/bulk', [JobPostingController::class, 'bulk'])->middleware('permission:jobs.publish');
        Route::get('job-postings', [JobPostingController::class, 'index'])->middleware('permission:jobs.view');
        Route::post('job-postings', [JobPostingController::class, 'store'])->middleware('permission:jobs.manage');
        Route::get('job-postings/{jobPosting}', [JobPostingController::class, 'show'])->middleware('permission:jobs.view');
        Route::match(['put', 'patch'], 'job-postings/{jobPosting}', [JobPostingController::class, 'update'])->middleware('permission:jobs.manage');
        Route::delete('job-postings/{jobPosting}', [JobPostingController::class, 'destroy'])->middleware('permission:jobs.manage');
        Route::post('job-postings/{jobPosting}/publish', [JobPostingController::class, 'publish'])->middleware('permission:jobs.publish');
        Route::post('job-postings/{jobPosting}/unpublish', [JobPostingController::class, 'unpublish'])->middleware('permission:jobs.publish');
        Route::post('job-postings/{jobPosting}/close', [JobPostingController::class, 'close'])->middleware('permission:jobs.publish');
        Route::post('job-postings/{jobPosting}/extend', [JobPostingController::class, 'extend'])->middleware('permission:jobs.publish');
        Route::post('job-postings/{jobPosting}/duplicate', [JobPostingController::class, 'duplicate'])->middleware('permission:jobs.manage');

        Route::get('candidates', [CandidateController::class, 'index'])->middleware('permission:candidates.view');
        Route::get('candidates/{candidate}', [CandidateController::class, 'show'])->middleware('permission:candidates.view');
        Route::patch('candidates/{candidate}', [CandidateController::class, 'update'])->middleware('permission:candidates.update');
        Route::post('candidates/{candidate}/notes', [CandidateController::class, 'note'])->middleware('permission:candidates.notes');
        Route::post('candidates/{candidate}/blacklist', [CandidateController::class, 'blacklist'])->middleware('permission:candidates.blacklist');
        Route::delete('candidates/{candidate}/blacklist', [CandidateController::class, 'removeBlacklist'])->middleware('permission:candidates.blacklist');
        Route::post('candidates/{candidate}/role-blocks/{roleKey}/override', [CandidateController::class, 'overrideRoleBlock'])
            ->middleware('permission:blocks.override');
        Route::get('candidates/{candidate}/resume', [CandidateController::class, 'resume'])->middleware('permission:candidates.resume');
        Route::get('candidates/{candidate}/activity', [CandidateController::class, 'activity'])->middleware('permission:candidates.view');

        Route::get('applications', [HrApplicationController::class, 'index'])->middleware('permission:applications.view');
        Route::post('applications/bulk-status', [HrApplicationController::class, 'bulkStatus'])->middleware('permission:applications.update');
        Route::patch('applications/{application}/status', [HrApplicationController::class, 'updateStatus'])->middleware('permission:applications.update');
        Route::post('applications/{application}/undo-status', [HrApplicationController::class, 'undoStatus'])->middleware('permission:applications.update');
        Route::post('applications/{application}/assign-job', [HrApplicationController::class, 'assignJob'])->middleware('permission:applications.update');

        Route::get('exports', [ExportController::class, 'index'])->middleware('permission:candidates.export|applications.view');
        Route::post('exports', [ExportController::class, 'store'])->middleware(['permission:candidates.export|applications.view', 'throttle:export']);
        Route::get('exports/{export}', [ExportController::class, 'show'])->middleware('permission:candidates.export|applications.view');
        Route::get('exports/{export}/download', [ExportController::class, 'download'])->middleware('permission:candidates.export|applications.view');
    });
});

Route::prefix('candidate')->middleware('auth:candidate')->group(function () {
    Route::get('me', [SessionController::class, 'me']);
    Route::post('logout', [SessionController::class, 'logout']);
    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);
    Route::post('profile/resume', [ProfileController::class, 'uploadResume']);
    Route::get('profile/resume', [ProfileController::class, 'resume']);
    Route::get('applications', [CandidateApplicationController::class, 'index']);
    Route::get('jobs/{jobPosting}/eligibility', [CandidateApplicationController::class, 'eligibility']);
    Route::post('jobs/{jobPosting}/apply', [CandidateApplicationController::class, 'apply'])->middleware('throttle:apply');
    Route::put('subscription', [SubscriptionController::class, 'update']);
});
