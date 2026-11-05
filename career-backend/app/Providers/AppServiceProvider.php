<?php

namespace App\Providers;

use App\Models\AboutBlock;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\EmployeeStory;
use App\Models\Entity;
use App\Models\Faq;
use App\Models\InterviewRound;
use App\Models\InterviewStep;
use App\Models\JobPosting;
use App\Models\MediaItem;
use App\Models\Recognition;
use App\Models\RecruitmentDrive;
use App\Models\SiteSetting;
use App\Observers\ApplicationObserver;
use App\Observers\CandidateObserver;
use App\Observers\ContentObserver;
use App\Observers\InterviewRoundObserver;
use App\Observers\JobPostingObserver;
use App\Listeners\LogSentEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Model::preventLazyLoading(! $this->app->isProduction());
        $this->registerPolicies();

        JobPosting::observe(JobPostingObserver::class);
        Application::observe(ApplicationObserver::class);
        Candidate::observe(CandidateObserver::class);
        InterviewRound::observe(InterviewRoundObserver::class);

        foreach ([AboutBlock::class, InterviewStep::class, EmployeeStory::class, RecruitmentDrive::class, Faq::class, Recognition::class, MediaItem::class, SiteSetting::class, Entity::class] as $model) {
            $model::observe(ContentObserver::class);
        }

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('hr-login', function (Request $request) {
            return Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip());
        });

        RateLimiter::for('oauth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('public', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        RateLimiter::for('apply', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('export', function (Request $request) {
            return Limit::perMinute(10)->by((string) ($request->user()?->id ?: $request->ip()));
        });

        Event::listen(MessageSent::class, LogSentEmail::class);
    }

    private function registerPolicies(): void
    {
        $models = [
            \App\Models\User::class,
            \App\Models\Entity::class,
            \App\Models\Department::class,
            \App\Models\Team::class,
            \App\Models\Skill::class,
            \App\Models\JobPosting::class,
            \App\Models\Candidate::class,
            \App\Models\Application::class,
            \App\Models\ApplicationStatusHistory::class,
            \App\Models\InterviewRound::class,
            \App\Models\CandidateNote::class,
            \App\Models\RoleBlock::class,
            \App\Models\TalentMember::class,
            \App\Models\Campaign::class,
            \App\Models\EmailLog::class,
            \App\Models\NotificationPreference::class,
            \App\Models\SavedFilter::class,
            \App\Models\Export::class,
            \App\Models\AuditLog::class,
            \App\Models\SiteSetting::class,
            \App\Models\AboutBlock::class,
            \App\Models\InterviewStep::class,
            \App\Models\EmployeeStory::class,
            \App\Models\RecruitmentDrive::class,
            \App\Models\Faq::class,
            \App\Models\Recognition::class,
            \App\Models\MediaItem::class,
        ];

        foreach ($models as $model) {
            Gate::policy($model, 'App\\Policies\\'.class_basename($model).'Policy');
        }
    }
}
