<?php

namespace App\Providers;

use App\Listeners\LogSentEmail;
use App\Models\AboutBlock;
use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\AuditLog;
use App\Models\Campaign;
use App\Models\Candidate;
use App\Models\CandidateNote;
use App\Models\Department;
use App\Models\EmailLog;
use App\Models\EmployeeStory;
use App\Models\Entity;
use App\Models\Export;
use App\Models\Faq;
use App\Models\InterviewRound;
use App\Models\InterviewStep;
use App\Models\JobPosting;
use App\Models\MediaItem;
use App\Models\NotificationPreference;
use App\Models\Recognition;
use App\Models\RecruitmentDrive;
use App\Models\RoleBlock;
use App\Models\SavedFilter;
use App\Models\SiteSetting;
use App\Models\Skill;
use App\Models\TalentMember;
use App\Models\Team;
use App\Models\User;
use App\Observers\ApplicationObserver;
use App\Observers\CandidateObserver;
use App\Observers\ContentObserver;
use App\Observers\InterviewRoundObserver;
use App\Observers\JobPostingObserver;
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

        // Public reads are cheap and cached. Many candidates can share one IP (a campus drive on one
        // Wi-Fi network), so this is generous; applying and sign-ups have their own stricter limits.
        RateLimiter::for('public', function (Request $request) {
            return Limit::perMinute((int) config('services.rate_limits.public_per_minute', 600))->by($request->ip());
        });

        RateLimiter::for('apply', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(60)->by((string) ($request->user()?->id ?: $request->ip()));
        });

        RateLimiter::for('unsubscribe', function (Request $request) {
            return Limit::perMinute(20)->by($request->ip());
        });

        RateLimiter::for('export', function (Request $request) {
            return Limit::perMinute(10)->by((string) ($request->user()?->id ?: $request->ip()));
        });

        Event::listen(MessageSent::class, LogSentEmail::class);
    }

    private function registerPolicies(): void
    {
        $models = [
            User::class,
            Entity::class,
            Department::class,
            Team::class,
            Skill::class,
            JobPosting::class,
            Candidate::class,
            Application::class,
            ApplicationStatusHistory::class,
            InterviewRound::class,
            CandidateNote::class,
            RoleBlock::class,
            TalentMember::class,
            Campaign::class,
            EmailLog::class,
            NotificationPreference::class,
            SavedFilter::class,
            Export::class,
            AuditLog::class,
            SiteSetting::class,
            AboutBlock::class,
            InterviewStep::class,
            EmployeeStory::class,
            RecruitmentDrive::class,
            Faq::class,
            Recognition::class,
            MediaItem::class,
        ];

        foreach ($models as $model) {
            Gate::policy($model, 'App\\Policies\\'.class_basename($model).'Policy');
        }
    }
}
