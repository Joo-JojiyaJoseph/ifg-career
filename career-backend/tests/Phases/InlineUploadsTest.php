<?php

/*
 * Every upload in the project, sent the way the apps now send it: as a base64 data URL inside the form, so it
 * never needs PHP's temporary upload folder (upload_tmp_dir). Covers company logo/photo/pattern, culture photos,
 * recruitment drives, recognitions, employee stories, section banners and resumes.
 */

use App\Jobs\ProcessUploadedImage;
use App\Models\Department;
use App\Models\Entity;
use App\Models\RecruitmentDrive;
use App\Services\ImageService;
use Database\Seeders\EntitySeeder;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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
    expect($entity->logo_path)->toStartWith('content/')
        ->and($entity->photo_path)->toStartWith('content/')
        ->and($entity->pattern_path)->toStartWith('content/')
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

    expect(RecruitmentDrive::query()->where('name', 'Inline upload drive')->value('photo_path'))->toStartWith('content/');
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

it('publishes an uploaded image straight away, without the background worker', function () {
    actingAsHr('Admin');

    $this->postJson('/api/v1/hr/content/entities/webfolks', ['photo' => pngDataUrl('team.png')])->assertOk();
    // Asked for on Herd's address, the image address uses that host too, whatever APP_URL says.
    $theme = collect($this->getJson('http://career-backend.test/api/v1/hr/content/entities')->assertOk()->json('data'))->firstWhere('slug', 'webfolks')['theme'];

    Queue::assertNotPushed(ProcessUploadedImage::class);
    expect($theme['photo_processing'])->toBeFalse()
        ->and($theme['photo_url'])->toStartWith('http://career-backend.test/storage/content/');
    Storage::disk('public')->assertExists(Entity::query()->where('slug', 'webfolks')->value('photo_path'));
});

it('still finishes an older upload that was left waiting for the worker', function () {
    $entity = Entity::query()->where('slug', 'webfolks')->first();
    $pending = Storage::disk('private')->putFileAs('uploads/pending', UploadedFile::fake()->image('old.png', 80, 40), 'old.png');
    $entity->forceFill(['photo_path' => 'pending:'.$pending])->save();

    (new ProcessUploadedImage(Entity::class, $entity->id, 'photo_path', $pending))->handle(app(ImageService::class));

    expect($entity->fresh()->photo_path)->toStartWith('content/');
});

it('refuses a file that is not a readable image with a clear message', function () {
    actingAsHr('Admin');

    $fake = 'data:image/png;name=fake.png;base64,'.base64_encode('this is not an image');
    $this->postJson('/api/v1/hr/content/media-items', ['type' => 'activity', 'title' => 'Broken', 'image' => $fake])->assertUnprocessable();
});

it('reports in System health whether the image folder link is in place', function () {
    actingAsHr('Admin');

    $this->getJson('/api/v1/hr/system/health')->assertOk()
        ->assertJsonStructure(['data' => ['uploads' => ['storage_linked', 'public_url', 'post_max_ok', 'ok']]]);
});

it('serves a published image itself when the public/storage link is missing', function () {
    Storage::disk('public')->put('content/sample.webp', 'RIFF0000WEBPVP8 ');

    $this->get('/storage/content/sample.webp')->assertOk()->assertHeader('Content-Type', 'image/webp');
    $this->get('/storage/content/missing.webp')->assertNotFound();
    $this->get('/storage/content/../../.env')->assertNotFound();
    $this->get('/storage/content/sample.php')->assertNotFound();
});
