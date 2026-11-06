<?php

use App\Enums\CampaignStatus;
use App\Mail\CommunityEmail;
use App\Models\Campaign;
use App\Models\EmailLog;
use App\Models\Faq;
use App\Models\JobPosting;
use App\Models\RecruitmentDrive;
use App\Models\TalentMember;
use App\Notifications\CampaignFinished;
use App\Support\HtmlSanitizer;
use Database\Seeders\EntitySeeder;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

require_once __DIR__.'/Support.php';

uses(TestCase::class, RefreshDatabase::class);

it('strips scripts, handlers and unsafe links from rich text', function () {
    $clean = HtmlSanitizer::clean('<p onclick="x()">Hi <script>alert(1)</script><a href="javascript:evil()">bad</a> <a href="https://infolksgroup.com">ok</a><img src=x onerror=alert(1)></p>');

    expect($clean)->not->toContain('script')
        ->not->toContain('onclick')
        ->not->toContain('javascript:')
        ->not->toContain('<img')
        ->toContain('href="https://infolksgroup.com"');
});

it('lists talent members with filters and counts', function () {
    actingAsHr();
    TalentMember::factory()->count(3)->create(['is_subscribed' => true]);
    TalentMember::factory()->create(['is_subscribed' => false]);

    $this->getJson('/api/v1/hr/talent-members?subscribed=1')
        ->assertOk()
        ->assertJsonPath('meta.total', 3)
        ->assertJsonPath('counts.subscribed', 3)
        ->assertJsonPath('counts.unsubscribed', 1);
});

it('previews a job alert with the recipient count', function () {
    actingAsHr();
    TalentMember::factory()->count(2)->create(['is_subscribed' => true]);
    $job = JobPosting::factory()->published()->create(['title' => 'Laravel Developer']);

    $this->postJson('/api/v1/hr/campaigns/preview', ['type' => 'job_alert', 'subject' => 'New roles', 'jobs' => [$job->public_id]])
        ->assertOk()
        ->assertJsonPath('data.recipient_count', 2)
        ->assertJsonPath('data.html', fn ($html) => str_contains($html, 'Laravel Developer') && str_contains($html, 'Unsubscribe'));
});

it('only allows open published jobs in a job alert', function () {
    actingAsHr();
    $closed = JobPosting::factory()->closed()->create();

    $this->postJson('/api/v1/hr/campaigns/preview', ['type' => 'job_alert', 'subject' => 'New roles', 'jobs' => [$closed->public_id]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('jobs');
});

it('sends a campaign to subscribed members only, logs each email and tells the sender', function () {
    Mail::fake();
    Notification::fake();
    $user = actingAsHr();
    $subscribed = TalentMember::factory()->count(3)->create(['is_subscribed' => true]);
    $unsubscribed = TalentMember::factory()->create(['is_subscribed' => false]);

    $campaign = $this->postJson('/api/v1/hr/campaigns', [
        'type' => 'company_update',
        'subject' => 'We are hiring in Kochi',
        'body' => '<p>Big news <script>alert(1)</script></p>',
    ])->assertCreated()->json('data');

    expect($campaign['body'])->not->toContain('script');

    $this->postJson("/api/v1/hr/campaigns/{$campaign['public_id']}/send")->assertStatus(202);

    $sent = Campaign::query()->firstWhere('public_id', $campaign['public_id']);
    expect($sent->status)->toBe(CampaignStatus::Sent)
        ->and($sent->sent_count)->toBe(3)
        ->and(EmailLog::query()->where('campaign_id', $sent->id)->count())->toBe(3);

    Mail::assertSent(CommunityEmail::class, 3);
    Mail::assertNotSent(CommunityEmail::class, fn ($mail) => $mail->hasTo($unsubscribed->email));
    Mail::assertSent(CommunityEmail::class, fn ($mail) => str_contains($mail->unsubscribeUrl, '/unsubscribe/') && $mail->oneClickUrl !== '');
    Notification::assertSentTo($user, CampaignFinished::class);

    $this->postJson("/api/v1/hr/campaigns/{$campaign['public_id']}/send")->assertUnprocessable();
});

it('lets a member unsubscribe and re-subscribe with the token, including one-click', function () {
    $member = TalentMember::factory()->create(['is_subscribed' => true, 'email' => 'meera@example.com']);

    $this->getJson("/api/v1/public/unsubscribe/{$member->unsubscribe_token}")
        ->assertOk()
        ->assertJsonPath('data.is_subscribed', true)
        ->assertJsonPath('data.email_hint', fn ($hint) => str_starts_with($hint, 'me') && ! str_contains($hint, 'meera@'));

    $this->postJson("/api/v1/public/unsubscribe/{$member->unsubscribe_token}")->assertOk()->assertJsonPath('data.is_subscribed', false);
    expect($member->fresh()->is_subscribed)->toBeFalse();

    $this->postJson("/api/v1/public/resubscribe/{$member->unsubscribe_token}")->assertOk()->assertJsonPath('data.is_subscribed', true);
    $this->getJson('/api/v1/public/unsubscribe/not-a-real-token-1234567890')->assertNotFound();
});

it('lets HR create, reorder and delete FAQs and sanitises answers', function () {
    actingAsHr();

    $first = $this->postJson('/api/v1/hr/content/faqs', ['question' => 'Do you hire freshers?', 'answer' => '<p>Yes<script>x</script></p>'])
        ->assertCreated()->json('data');
    $second = $this->postJson('/api/v1/hr/content/faqs', ['question' => 'Is there a bond?', 'answer' => 'No.'])->assertCreated()->json('data');

    expect($first['answer'])->toBe('<p>Yes</p>');

    $this->postJson('/api/v1/hr/content/faqs/reorder', ['ids' => [$second['id'], $first['id']]])->assertNoContent();
    expect(Faq::query()->ordered()->first()->id)->toBe($second['id']);

    $this->deleteJson("/api/v1/hr/content/faqs/{$first['id']}")->assertNoContent();
    expect(Faq::query()->count())->toBe(1);
});

it('refuses to publish an employee story without permission', function () {
    actingAsHr();

    $this->postJson('/api/v1/hr/content/employee-stories', [
        'name' => 'Anu', 'role' => 'Designer', 'quote' => 'Great team.', 'publish_permission_confirmed' => false, 'is_published' => true,
    ])->assertUnprocessable()->assertJsonValidationErrors('is_published');
});

it('processes uploaded drive photos before they appear publicly', function () {
    Storage::fake('public');
    Storage::fake('private');
    actingAsHr();

    $data = $this->post('/api/v1/hr/content/recruitment-drives', [
        'name' => 'Kochi campus drive',
        'drive_date' => now()->subWeek()->toDateString(),
        'caption' => 'Freshers day',
        'image' => UploadedFile::fake()->image('drive.jpg', 2400, 1200),
    ], ['Accept' => 'application/json'])->assertCreated()->json('data');

    $drive = RecruitmentDrive::query()->find($data['id']);
    expect($drive->photo_path)->toStartWith('content/');
    Storage::disk('public')->assertExists($drive->photo_path);
    [$width] = getimagesizefromstring(Storage::disk('public')->get($drive->photo_path));
    expect($width)->toBe(1600);
});

it('serves the public content payload with an ETag and hides unpublished items', function () {
    $this->seed(EntitySeeder::class);
    $this->seed(WebsiteContentSeeder::class);
    Faq::query()->create(['question' => 'Hidden?', 'answer' => 'x', 'is_published' => false]);

    $response = $this->getJson('/api/v1/public/content')
        ->assertOk()
        ->assertJsonStructure(['data' => ['hero', 'about' => ['blocks'], 'interview_steps', 'stories', 'drives', 'faqs', 'recognitions', 'social_links', 'footer', 'entities']])
        ->assertJsonMissing(['question' => 'Hidden?']);

    $this->getJson('/api/v1/public/content', ['If-None-Match' => $response->headers->get('ETag')])->assertStatus(304);
});

it('updates site settings and entity cards', function () {
    $this->seed(EntitySeeder::class);
    actingAsHr();

    $this->postJson('/api/v1/hr/content/settings/hero', ['motto' => 'Build what matters', 'company_line' => 'Four companies, one group.'])
        ->assertOk()->assertJsonPath('data.motto', 'Build what matters');

    $this->postJson('/api/v1/hr/content/settings/social_links', ['links' => [['name' => 'LinkedIn', 'url' => 'https://linkedin.com/company/x']]])
        ->assertOk();

    $this->postJson('/api/v1/hr/content/entities/webfolks', ['motto' => 'Websites that work', 'primary_color' => '#123ABC'])
        ->assertOk()->assertJsonPath('data.theme.primary', '#123ABC');

    $this->postJson('/api/v1/hr/content/entities/webfolks', ['primary_color' => 'blue'])->assertUnprocessable();
    expect($this->getJson('/api/v1/public/content')->json('data.hero.motto'))->toBe('Build what matters');
});
