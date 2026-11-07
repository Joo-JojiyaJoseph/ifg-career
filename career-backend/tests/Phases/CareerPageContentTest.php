<?php

use App\Models\Faq;
use App\Models\InterviewStep;
use Database\Seeders\EntitySeeder;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

require_once __DIR__.'/Support.php';

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(EntitySeeder::class);
    $this->seed(WebsiteContentSeeder::class);
});

it('serves the career page copy in section order', function () {
    $content = $this->getJson('/api/v1/public/content')->assertOk()->json('data');

    expect($content['hero'])->toMatchArray(['eyebrow' => 'Be part of our heart', 'title' => 'Infolks Group', 'motto' => 'A company with a heart'])
        ->and($content['sections']['entities']['title'])->toBe('Our story has more than one way in')
        ->and($content['about']['title'])->toBe('Why Join Infolks Group')
        ->and(array_column($content['about']['blocks'], 'title'))->toBe(['How We Work', 'What We Provide', 'Our Culture'])
        ->and($content['sections']['interview'])->toMatchArray(['eyebrow' => 'How we hire', 'title' => 'Our Recruitment Process'])
        ->and(array_column($content['interview_steps'], 'name'))->toBe(['Apply', 'Screening', 'Round 1: Skill Test', 'Round 2: HR Round', 'Final Result'])
        ->and($content['sections']['quick_apply']['title'])->toBe('Your story could begin here')
        ->and($content['sections']['faq']['title'])->toBe('A few things you might want to know')
        ->and($content['faqs'])->toHaveCount(7)
        ->and($content['footer']['closing_title'])->toBeNull()
        ->and($content['hero']['company_line'])->toContain('Infolks, Medrays, Webfolks and Dataways')
        ->and(array_column($content['social_links'], 'name'))->toBe(['Instagram', 'Facebook', 'LinkedIn', 'YouTube'])
        ->and($content['quick_apply_confirmation']['title'])->toBe('Thank you for sharing your profile with us!');
});

it('carries the October 2026 FAQ corrections', function () {
    $answers = collect($this->getJson('/api/v1/public/content')->json('data.faqs'))->pluck('answer', 'question');

    expect($answers['Does Infolks Group offer internship opportunities?'])->toContain('Internship option in the top bar')
        ->and($answers['Can I apply for more than one position?'])->toContain('after 6 months')
        ->and($answers['How will I know the status of my application?'])->toContain('Candidate profile')
        ->and($answers['What happens after I submit my application?'])->toContain('confirmation email');
});

it('lists the four companies in career page order, each with a tagline and a photo', function () {
    $entities = $this->getJson('/api/v1/public/content')->json('data.entities');

    expect(array_column($entities, 'slug'))->toBe(['infolks', 'medrays', 'webfolks', 'dataways'])
        ->and(array_column($entities, 'motto'))->toBe(['AI Data Annotation Company', 'Medical Data Annotation Services', 'Digital Marketing and IT Solutions', 'Data Collection Company']);

    foreach ($entities as $entity) {
        expect($entity['theme']['photo_url'])->toStartWith('https://images.unsplash.com/');
    }
});

it('shows culture photos and hides the old placeholder items when the seeder runs again', function () {
    InterviewStep::query()->create(['name' => 'Old step', 'description' => 'Hidden now', 'sort_order' => 9, 'is_published' => true]);
    Faq::query()->create(['question' => 'Old question?', 'answer' => '<p>Old</p>', 'sort_order' => 9, 'is_published' => true]);

    $this->seed(WebsiteContentSeeder::class);
    $content = $this->getJson('/api/v1/public/content')->json('data');

    expect(array_column($content['interview_steps'], 'name'))->not->toContain('Old step')
        ->and(array_column($content['faqs'], 'question'))->not->toContain('Old question?')
        ->and(array_column($content['media'], 'title'))->toBe(['Festival celebrations', 'Everyday conversations', 'Company trips', 'Reasons to celebrate']);
});

it('lets HR edit section headings, and the change shows on the careers page', function () {
    actingAsHr();

    $this->postJson('/api/v1/hr/content/settings/interview_section', ['eyebrow' => 'Join us', 'title' => 'How we hire'])
        ->assertOk()
        ->assertJsonPath('data.title', 'How we hire');
    $this->postJson('/api/v1/hr/content/settings/footer', ['copyright' => 'Infolks Group.', 'closing_title' => 'See you soon'])->assertOk();
    $this->postJson('/api/v1/hr/content/settings/faq_section', ['title' => ''])->assertUnprocessable();

    $content = $this->getJson('/api/v1/public/content')->json('data');
    expect($content['sections']['interview']['title'])->toBe('How we hire')
        ->and($content['footer']['closing_title'])->toBe('See you soon');
});

it('replaces a company photo with an upload', function () {
    Queue::fake();
    actingAsHr();

    $this->post('/api/v1/hr/content/entities/medrays', ['photo' => UploadedFile::fake()->image('team.jpg', 1200, 800)], ['Accept' => 'application/json'])
        ->assertOk();

    $this->post('/api/v1/hr/content/entities/medrays', ['photo' => UploadedFile::fake()->create('notes.pdf', 20, 'application/pdf')], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('photo');
});
