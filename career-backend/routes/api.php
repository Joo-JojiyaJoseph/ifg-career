<?php

use App\Http\Controllers\Candidate\ApplicationController as CandidateApplicationController;
use App\Http\Controllers\Candidate\ProfileController;
use App\Http\Controllers\Candidate\SessionController;
use App\Http\Controllers\Candidate\SubscriptionController;
use App\Http\Controllers\Hr\ApplicationController as HrApplicationController;
use App\Http\Controllers\Hr\AuditLogController;
use App\Http\Controllers\Hr\AuthController;
use App\Http\Controllers\Hr\CandidateController;
use App\Http\Controllers\Hr\CandidateResumeController;
use App\Http\Controllers\Hr\ContentController;
use App\Http\Controllers\Hr\DashboardController;
use App\Http\Controllers\Hr\ExportController;
use App\Http\Controllers\Hr\InterviewController;
use App\Http\Controllers\Hr\JobPostingController;
use App\Http\Controllers\Hr\ListController;
use App\Http\Controllers\Hr\NotificationController;
use App\Http\Controllers\Hr\ReportController;
use App\Http\Controllers\Hr\SavedFilterController;
use App\Http\Controllers\Hr\SearchController;
use App\Http\Controllers\Hr\SystemController;
use App\Http\Controllers\Hr\TalentController;
use App\Http\Controllers\Hr\UserController;
use App\Http\Controllers\Public\ContentController as PublicContentController;
use App\Http\Controllers\Public\EntityController;
use App\Http\Controllers\Public\JobController;
use App\Http\Controllers\Public\MetaController;
use App\Http\Controllers\Public\QuickApplyController;
use App\Http\Controllers\Public\TalentCommunityController;
use App\Http\Controllers\Public\UnsubscribeController;
use App\Services\ContentService;
use App\Services\ReportService;
use App\Support\ContentTypes;
use App\Support\ListTypes;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:public')->group(function () {
    Route::get('public/meta', MetaController::class);
    Route::get('public/entities', [EntityController::class, 'index']);
    Route::get('public/content', PublicContentController::class);
    Route::get('public/jobs', [JobController::class, 'index']);
    Route::get('public/jobs/{jobPosting}', [JobController::class, 'show'])->name('public.jobs.show');
    Route::post('public/quick-apply', [QuickApplyController::class, 'store'])->middleware('throttle:apply');
    Route::post('public/talent-community', [TalentCommunityController::class, 'store'])->middleware('throttle:apply');
    Route::get('public/unsubscribe/{token}', [UnsubscribeController::class, 'show'])->middleware('throttle:unsubscribe');
    Route::post('public/unsubscribe/{token}', [UnsubscribeController::class, 'unsubscribe'])->middleware('throttle:unsubscribe');
    Route::post('public/resubscribe/{token}', [UnsubscribeController::class, 'resubscribe'])->middleware('throttle:unsubscribe');
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

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'read'])->whereUuid('id');
        Route::get('notification-preferences', [NotificationController::class, 'preferences']);
        Route::put('notification-preferences', [NotificationController::class, 'updatePreferences']);

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

        Route::get('interviews', [InterviewController::class, 'index'])->middleware('permission:interviews.view');
        Route::get('interviews/pipeline', [InterviewController::class, 'pipeline'])->middleware('permission:interviews.view');
        Route::post('applications/{application}/rounds', [InterviewController::class, 'store'])->middleware('permission:interviews.manage');
        Route::patch('applications/{application}/result', [InterviewController::class, 'result'])->middleware('permission:interviews.manage');
        Route::match(['put', 'patch'], 'rounds/{round}', [InterviewController::class, 'update'])->middleware('permission:interviews.manage');
        Route::delete('rounds/{round}', [InterviewController::class, 'destroy'])->middleware('permission:interviews.manage');
        Route::patch('rounds/{round}/status', [InterviewController::class, 'status'])->middleware('permission:interviews.manage');
        Route::post('rounds/{round}/retry-sync', [InterviewController::class, 'retrySync'])->middleware('permission:interviews.manage');

        Route::get('talent-members', [TalentController::class, 'members'])->middleware('permission:talent.view');
        Route::get('campaigns', [TalentController::class, 'campaigns'])->middleware('permission:talent.view');
        Route::post('campaigns/preview', [TalentController::class, 'preview'])->middleware('permission:campaigns.send');
        Route::post('campaigns', [TalentController::class, 'store'])->middleware('permission:campaigns.send');
        Route::get('campaigns/{campaign}', [TalentController::class, 'show'])->middleware('permission:talent.view');
        Route::match(['put', 'patch'], 'campaigns/{campaign}', [TalentController::class, 'update'])->middleware('permission:campaigns.send');
        Route::post('campaigns/{campaign}/send', [TalentController::class, 'send'])->middleware(['permission:campaigns.send', 'throttle:export']);

        Route::middleware('permission:content.manage')->prefix('content')->group(function () {
            Route::get('settings', [ContentController::class, 'settings']);
            Route::post('settings/{key}', [ContentController::class, 'updateSetting'])->whereIn('key', array_keys(ContentService::SETTINGS));
            Route::get('entities', [ContentController::class, 'entities']);
            Route::post('entities/{slug}', [ContentController::class, 'updateEntity'])->where('slug', '[a-z0-9-]+');
            Route::get('{type}', [ContentController::class, 'index'])->where('type', ContentTypes::PATTERN);
            Route::post('{type}', [ContentController::class, 'store'])->where('type', ContentTypes::PATTERN);
            Route::post('{type}/reorder', [ContentController::class, 'reorder'])->where('type', ContentTypes::PATTERN);
            Route::post('{type}/{id}', [ContentController::class, 'update'])->where(['type' => ContentTypes::PATTERN, 'id' => '[0-9]+']);
            Route::delete('{type}/{id}', [ContentController::class, 'destroy'])->where(['type' => ContentTypes::PATTERN, 'id' => '[0-9]+']);
        });

        Route::prefix('dashboard')->middleware('permission:applications.view|jobs.view')->group(function () {
            Route::get('stats', [DashboardController::class, 'stats']);
            Route::get('action-items', [DashboardController::class, 'actionItems']);
            Route::get('pipeline', [DashboardController::class, 'pipeline']);
            Route::get('applications-over-time', [DashboardController::class, 'applicationsOverTime']);
            Route::get('sources', [DashboardController::class, 'sources']);
            Route::get('upcoming-interviews', [DashboardController::class, 'upcomingInterviews']);
            Route::get('recent-candidates', [DashboardController::class, 'recentCandidates']);
            Route::get('promo', [DashboardController::class, 'promo']);
        });
        Route::get('search', SearchController::class)->middleware('throttle:search');

        Route::get('reports', [ReportController::class, 'index'])->middleware('permission:reports.view');
        Route::get('reports/{report}', [ReportController::class, 'show'])->middleware('permission:reports.view')->whereIn('report', array_keys(ReportService::REPORTS));

        Route::middleware('permission:settings.users')->group(function () {
            Route::get('users', [UserController::class, 'index']);
            Route::post('users', [UserController::class, 'store']);
            Route::patch('users/{user}', [UserController::class, 'update']);
            Route::post('users/{user}/toggle-active', [UserController::class, 'toggleActive']);
            Route::post('users/{user}/reset-2fa', [UserController::class, 'resetTwoFactor']);
            Route::post('users/{user}/resend-invite', [UserController::class, 'resendInvite']);
            Route::get('roles-permissions', [UserController::class, 'roles']);
            Route::put('roles-permissions', [UserController::class, 'saveRoles']);
            Route::get('system/health', [SystemController::class, 'health']);
            Route::post('system/test/{integration}', [SystemController::class, 'test'])->whereIn('integration', ['google_calendar', 'mail'])->middleware('throttle:export');
            Route::post('system/failed-jobs/{uuid}/retry', [SystemController::class, 'retryFailed'])->whereUuid('uuid');
        });

        Route::middleware('permission:settings.lists')->group(function () {
            Route::get('lists/{type}', [ListController::class, 'index'])->where('type', ListTypes::PATTERN);
            Route::post('lists/{type}', [ListController::class, 'store'])->where('type', ListTypes::PATTERN);
            Route::patch('lists/{type}/{id}', [ListController::class, 'update'])->where(['type' => ListTypes::PATTERN, 'id' => '[0-9]+']);
            Route::delete('lists/{type}/{id}', [ListController::class, 'destroy'])->where(['type' => ListTypes::PATTERN, 'id' => '[0-9]+']);
        });

        Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('permission:audit.view');

        Route::get('exports', [ExportController::class, 'index'])->middleware('permission:candidates.export|applications.view|talent.export');
        Route::post('exports', [ExportController::class, 'store'])->middleware(['permission:candidates.export|applications.view|talent.export', 'throttle:export']);
        Route::get('exports/{export}', [ExportController::class, 'show'])->middleware('permission:candidates.export|applications.view|talent.export');
        Route::get('exports/{export}/download', [ExportController::class, 'download'])->middleware('permission:candidates.export|applications.view|talent.export');
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
