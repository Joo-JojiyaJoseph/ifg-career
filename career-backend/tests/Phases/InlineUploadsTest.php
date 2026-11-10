<?php

/*
 * Every upload in the project, sent the way the apps now send it: as a base64 data URL inside the form, so it
 * never needs PHP's temporary upload folder (upload_tmp_dir). Covers company logo/photo/pattern, culture photos,
 * recruitment drives, recognitions, employee stories, section banners and resumes.
 */

use App\Models\Department;
use App\Models\Entity;
use App\Models\RecruitmentDrive;
use Database\Seeders\EntitySeeder;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

require_once __DIR__.'/Support.php';

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(EntitySeeder::class);
    Storage::fake('private');
    Storage::fake('public');
    Queue::fake();
});

function pngDataUrl(string $name = 'logo.png'): string
{
    $image = imagecreatetruecolor(60, 40);
    ob_start();
    imagepng($image);

    return 'data:image/png;name='.rawurlencode($name).';base64,'.base64_encode((string) ob_get_clean());
}

function pdfDataUrl(): string
{
    return 'data:application/pdf;name=resume.pdf;base64,'.base64_encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
}

it('saves a company logo, photo and pattern sent as data URLs', function () {
    actingAsHr('Admin');

    $this->postJson('/api/v1/hr/content/entities/webfolks', [
        'logo' => pngDataUrl('Screenshot 15.png'),
        'photo' => pngDataUrl('team.png'),
        'pattern' => pngDataUrl('pattern.png'),
    ])->assertOk();

    $entity = Entity::query()->where('slug', 'webfolks')->first();
    expect($entity->logo_path)->toStartWith('pending:')
        ->and($entity->photo_path)->toStartWith('pending:')
        ->and($entity->pattern_path)->toStartWith('pending:')
        ->and(glob(storage_path('app/inline-uploads/*')))->toBe([]);       // temporary copies are removed
});

it('adds a new company with images sent as data URLs', function () {
    actingAsHr('Admin');

    $this->postJson('/api/v1/hr/content/entities', [
        'name' => 'Brightlane', 'primary_color' => '#7C3AED', 'secondary_color' => '#1E1B4B', 'accent_color' => '#22D3EE',
        'logo' => pngDataUrl(), 'photo' => pngDataUrl('team.png'),
    ])->assertCreated();
});

it('saves images for every kind of website content', function () {
    $this->seed(WebsiteContentSeeder::class);
    actingAsHr('Admin');

    $this->postJson('/api/v1/hr/content/media-items', ['type' => 'activity', 'title' => 'Onam', 'image' => pngDataUrl()])->assertCreated();
    $this->postJson('/api/v1/hr/content/recruitment-drives', ['name' => 'Inline upload drive', 'drive_date' => now()->toDateString(), 'image' => pngDataUrl()])->assertCreated();
    $this->postJson('/api/v1/hr/content/recognitions', ['name' => 'ISO 9001', 'image' => pngDataUrl('badge.png')])->assertCreated();
    $this->postJson('/api/v1/hr/content/employee-stories', ['name' => 'Asha', 'role' => 'Annotator', 'quote' => 'Great team.', 'image' => pngDataUrl('asha.png')])->assertCreated();
    $this->postJson('/api/v1/hr/content/settings/interview_section', ['title' => 'How we hire', 'image' => pngDataUrl('banner.png')])->assertOk();

    expect(RecruitmentDrive::query()->where('name', 'Inline upload drive')->value('photo_path'))->toStartWith('pending:');
});

it('accepts a resume sent as a data URL on Quick Apply', function () {
    $this->postJson('/api/v1/public/quick-apply', [
        'name' => 'Asha Menon', 'date_of_birth' => now()->subYears(24)->toDateString(), 'email' => 'asha.inline@example.com',
        'phone' => '+919847012345', 'gender' => 'female', 'highest_qualification' => 'B.Tech', 'location' => 'Palakkad',
        'department_id' => Department::factory()->create()->id, 'privacy_consent' => '1', 'resume' => pdfDataUrl(),
    ])->assertSuccessful();

    expect(Storage::disk('private')->allFiles('resumes'))->toHaveCount(1);
});

it('still checks the file type, so a PDF cannot be a logo', function () {
    actingAsHr('Admin');

    $this->postJson('/api/v1/hr/content/entities/webfolks', ['logo' => pdfDataUrl()])
        ->assertUnprocessable()->assertJsonValidationErrors('logo');
    $this->postJson('/api/v1/hr/content/entities/webfolks', ['logo' => 'data:image/png;base64,@@not-base64@@'])
        ->assertUnprocessable()->assertJsonValidationErrors('logo');
});

it('keeps a hostile file name out of the path', function () {
    actingAsHr('Admin');

    $this->postJson('/api/v1/hr/content/entities/webfolks', ['logo' => pngDataUrl('../../../.env')])->assertOk();
    expect(file_exists(base_path('.env.png')))->toBeFalse();
});
