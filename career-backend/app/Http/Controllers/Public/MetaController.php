<?php

namespace App\Http\Controllers\Public;

use App\Enums\ApplicationResult;
use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Enums\CalendarSyncStatus;
use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Enums\ColourTag;
use App\Enums\EmailType;
use App\Enums\ExportStatus;
use App\Enums\Gender;
use App\Enums\InterviewMode;
use App\Enums\JobLevel;
use App\Enums\JobStatus;
use App\Enums\MediaType;
use App\Enums\RoundStatus;
use App\Enums\SignupSource;
use App\Enums\TalentSource;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\JobPosting;
use App\Models\Skill;
use App\Models\Team;
use App\Support\CacheVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class MetaController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $version = CacheVersion::get('content');
        $payload = Cache::remember('meta:v'.$version, now()->addMinutes(10), function () {
            return [
                'enums' => [
                    'job_levels' => JobLevel::options(),
                    'job_statuses' => JobStatus::options(),
                    'application_types' => ApplicationType::options(),
                    'application_sources' => ApplicationSource::options(),
                    'application_statuses' => ApplicationStatus::options(),
                    'application_results' => ApplicationResult::options(),
                    'interview_modes' => InterviewMode::options(),
                    'round_statuses' => RoundStatus::options(),
                    'calendar_sync_statuses' => CalendarSyncStatus::options(),
                    'genders' => Gender::options(),
                    'colour_tags' => ColourTag::options(),
                    'signup_sources' => SignupSource::options(),
                    'talent_sources' => TalentSource::options(),
                    'campaign_types' => CampaignType::options(),
                    'campaign_statuses' => CampaignStatus::options(),
                    'email_types' => EmailType::options(),
                    'export_statuses' => ExportStatus::options(),
                    'media_types' => MediaType::options(),
                ],
                'departments' => Department::query()->active()->ordered()->get(['id', 'name'])
                    ->map(fn (Department $department) => ['id' => $department->id, 'name' => $department->name])->values()->all(),
                'teams' => Team::query()->active()->with('department:id,name')->orderBy('name')->get(['id', 'name', 'department_id'])
                    ->map(fn (Team $team) => ['id' => $team->id, 'name' => $team->name, 'department_id' => $team->department_id])->values()->all(),
                'skills' => Skill::query()->active()->orderBy('name')->get(['id', 'name', 'slug'])
                    ->map(fn (Skill $skill) => ['id' => $skill->id, 'name' => $skill->name, 'slug' => $skill->slug])->values()->all(),
                'locations' => JobPosting::query()->open()->distinct()->orderBy('location')->pluck('location')->values()->all(),
            ];
        });

        return response()->json(['data' => $payload]);
    }
}
