<?php

namespace App\Services;

use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Enums\JobStatus;
use App\Jobs\SendCampaignBatch;
use App\Mail\CommunityEmail;
use App\Models\Campaign;
use App\Models\JobPosting;
use App\Models\TalentMember;
use App\Models\User;
use App\Notifications\CampaignFinished;
use App\Support\HtmlSanitizer;
use Illuminate\Bus\Batch;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class CampaignService
{
    public const BATCH_SIZE = 100;

    /**
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters, int $perPage): LengthAwarePaginator
    {
        return Campaign::query()
            ->with(['sender:id,name', 'jobPostings:id,public_id,title'])
            ->when(filled($filters['type'] ?? null), fn ($query) => $query->where('type', $filters['type']))
            ->when(filled($filters['status'] ?? null), fn ($query) => $query->where('status', $filters['status']))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function recipientCount(): int
    {
        return TalentMember::query()->subscribed()->count();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{html: string, subject: string, recipient_count: int}
     */
    public function preview(array $data): array
    {
        $type = CampaignType::from($data['type']);
        $jobs = $this->jobs($data['jobs'] ?? []);
        $this->assertSendable($type, $jobs);

        $sample = new TalentMember(['name' => 'Priya', 'email' => 'priya@example.com', 'unsubscribe_token' => str_repeat('x', 64)]);
        $mail = $this->mailFor($type, (string) $data['subject'], HtmlSanitizer::clean($data['body'] ?? null), $jobs, $sample);

        return [
            'html' => $mail->render(),
            'subject' => (string) $data['subject'],
            'recipient_count' => $this->recipientCount(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function saveDraft(array $data, User $user, ?Campaign $campaign = null): Campaign
    {
        if ($campaign && $campaign->status !== CampaignStatus::Draft) {
            throw ValidationException::withMessages(['campaign' => 'Only a draft can be edited.']);
        }

        $jobs = $this->jobs($data['jobs'] ?? []);

        return DB::transaction(function () use ($data, $user, $campaign, $jobs) {
            $campaign ??= new Campaign(['status' => CampaignStatus::Draft, 'sent_by' => $user->id]);
            $campaign->fill([
                'type' => $data['type'],
                'subject' => $data['subject'],
                'body' => HtmlSanitizer::clean($data['body'] ?? null) ?: null,
            ])->save();
            $campaign->jobPostings()->sync($jobs->pluck('id'));

            return $campaign->fresh(['sender', 'jobPostings']);
        });
    }

    public function send(Campaign $campaign, User $user): Campaign
    {
        if ($campaign->status !== CampaignStatus::Draft) {
            throw ValidationException::withMessages(['campaign' => 'This campaign has already been sent.']);
        }

        $campaign->loadMissing('jobPostings');
        $this->assertSendable($campaign->type, $campaign->jobPostings);

        $memberIds = TalentMember::query()->subscribed()->orderBy('id')->pluck('id');

        if ($memberIds->isEmpty()) {
            throw ValidationException::withMessages(['campaign' => 'No one is subscribed to the talent community yet.']);
        }

        $campaign->forceFill([
            'status' => CampaignStatus::Sending,
            'sent_by' => $user->id,
            'recipient_count' => $memberIds->count(),
            'sent_count' => 0,
            'failed_count' => 0,
            'started_at' => now(),
        ])->save();

        $campaignId = $campaign->id;
        $jobs = $memberIds->chunk(self::BATCH_SIZE)->map(fn (Collection $ids) => new SendCampaignBatch($campaignId, $ids->values()->all()))->all();

        Bus::batch($jobs)
            ->name('campaign:'.$campaign->public_id)
            ->allowFailures()
            ->finally(function (Batch $batch) use ($campaignId) {
                app(CampaignService::class)->finish($campaignId, $batch->failedJobs > 0 && $batch->processedJobs() === 0);
            })
            ->dispatch();

        return $campaign->fresh(['sender', 'jobPostings']);
    }

    /**
     * Send one chunk of a campaign. Each email is logged; one failure never stops the rest.
     *
     * @param  list<int>  $memberIds
     */
    public function sendChunk(Campaign $campaign, array $memberIds): void
    {
        $campaign->loadMissing('jobPostings.entity');
        $jobs = $campaign->jobPostings;
        $body = $campaign->body;

        TalentMember::query()->whereIn('id', $memberIds)->subscribed()->get()->each(function (TalentMember $member) use ($campaign, $jobs, $body) {
            $log = $campaign->emailLogs()->create([
                'type' => $campaign->type->value,
                'recipient_email' => $member->email,
                'talent_member_id' => $member->id,
                'candidate_id' => $member->candidate_id,
                'job_posting_id' => $jobs->count() === 1 ? $jobs->first()->id : null,
                'status' => 'queued',
            ]);

            try {
                Mail::to($member->email, $member->name)
                    ->send($this->mailFor($campaign->type, $campaign->subject, $body, $jobs, $member));

                $log->forceFill(['status' => 'sent', 'sent_at' => $log->fresh()->sent_at ?? now()])->save();
                $campaign->increment('sent_count');
            } catch (Throwable $exception) {
                $log->forceFill(['status' => 'failed', 'error' => mb_substr(class_basename($exception).': '.$exception->getMessage(), 0, 500)])->save();
                $campaign->increment('failed_count');
            }
        });
    }

    public function finish(int $campaignId, bool $allFailed = false): void
    {
        $campaign = Campaign::query()->find($campaignId);

        if (! $campaign || $campaign->status !== CampaignStatus::Sending) {
            return;
        }

        $campaign->forceFill([
            'status' => $allFailed || ($campaign->sent_count === 0 && $campaign->failed_count > 0) ? CampaignStatus::Failed : CampaignStatus::Sent,
            'finished_at' => now(),
        ])->save();

        $campaign->sender?->notify(new CampaignFinished($campaign));
    }

    /**
     * @param  Collection<int, JobPosting>  $jobs
     */
    private function mailFor(CampaignType $type, string $subject, ?string $body, Collection $jobs, TalentMember $member): CommunityEmail
    {
        $careers = rtrim((string) config('app.frontend_careers_url'), '/');

        return new CommunityEmail(
            emailType: $type->value,
            recipientEmail: (string) $member->email,
            subjectLine: $subject,
            recipientName: (string) (str($member->name)->before(' ')->value() ?: 'there'),
            bodyHtml: $body,
            jobs: $jobs->map(fn (JobPosting $job) => [
                'title' => $job->title,
                'entity' => $job->entity?->name,
                'location' => $job->location,
                'level' => $job->level?->label(),
                'url' => $job->url.'?src=alert',
                'closes' => $job->last_date_to_apply?->format('d-m-Y'),
            ])->values()->all(),
            unsubscribeUrl: $member->unsubscribeUrl(),
            oneClickUrl: $member->oneClickUnsubscribeUrl(),
            careersUrl: $careers.'/jobs',
        );
    }

    /**
     * @param  list<string>  $publicIds
     * @return Collection<int, JobPosting>
     */
    private function jobs(array $publicIds): Collection
    {
        if ($publicIds === []) {
            return new Collection;
        }

        return JobPosting::query()->with('entity')->whereIn('public_id', $publicIds)->get();
    }

    /**
     * @param  Collection<int, JobPosting>  $jobs
     */
    private function assertSendable(CampaignType $type, Collection $jobs): void
    {
        if ($type !== CampaignType::JobAlert) {
            return;
        }

        if ($jobs->isEmpty()) {
            throw ValidationException::withMessages(['jobs' => 'Choose at least one published job for a job alert.']);
        }

        if ($jobs->contains(fn (JobPosting $job) => $job->status !== JobStatus::Published || $job->last_date_to_apply?->isPast() && ! $job->last_date_to_apply->isToday())) {
            throw ValidationException::withMessages(['jobs' => 'Job alerts can only include published jobs that are still open.']);
        }
    }
}
