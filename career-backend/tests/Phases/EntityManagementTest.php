<?php

use App\Models\Entity;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function signInAs(string $role): User
{
    test()->seed(RolesAndPermissionsSeeder::class);
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole($role);
    test()->actingAs($user);

    return $user;
}

function companyPayload(array $overrides = []): array
{
    return $overrides + [
        'name' => 'Brightlane',
        'motto' => 'Customer Experience Company',
        'short_description' => 'Help customers feel heard, every day.',
        'primary_color' => '#7C3AED',
        'secondary_color' => '#1E1B4B',
        'accent_color' => '#22D3EE',
        'website_url' => 'https://brightlane.example.com',
    ];
}

beforeEach(fn () => Queue::fake());

it('lets Admin add a company with its colours, logo and photo', function () {
    signInAs('Admin');

    $this->post('/api/v1/hr/content/entities', companyPayload([
        'logo' => UploadedFile::fake()->image('logo.jpg', 400, 400),
        'photo' => UploadedFile::fake()->image('team.jpg', 1600, 1000),
    ]), ['Accept' => 'application/json'])
        ->assertCreated()
        ->assertJsonPath('data.slug', 'brightlane')
        ->assertJsonPath('data.theme.primary', '#7C3AED');

    $entity = Entity::query()->where('slug', 'brightlane')->firstOrFail();
    expect($entity->is_active)->toBeTrue()
        ->and($entity->logo_path)->toStartWith('content/')
        ->and($entity->photo_path)->toStartWith('content/');

    $slugs = array_column($this->getJson('/api/v1/public/content')->json('data.entities'), 'slug');
    expect($slugs)->toContain('brightlane');
});

it('checks the new company details', function () {
    signInAs('Admin');
    Entity::factory()->create(['name' => 'Brightlane', 'slug' => 'brightlane']);

    $this->postJson('/api/v1/hr/content/entities', companyPayload(['primary_color' => 'purple']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'primary_color']);
});

it('lets Admin rename and hide a company, and hides it from the careers site', function () {
    signInAs('Admin');
    $entity = Entity::factory()->create(['slug' => 'brightlane', 'is_active' => true]);

    $this->post('/api/v1/hr/content/entities/brightlane', ['name' => 'Brightlane Labs', 'is_active' => '0'], ['Accept' => 'application/json'])->assertOk();

    expect($entity->fresh())->name->toBe('Brightlane Labs')->is_active->toBeFalse();
    expect(array_column($this->getJson('/api/v1/public/content')->json('data.entities'), 'slug'))->not->toContain('brightlane');
});

it('lets HR edit company details but not add, rename, hide or delete companies', function () {
    signInAs('HR');
    $entity = Entity::factory()->create(['name' => 'Brightlane', 'slug' => 'brightlane', 'is_active' => true]);

    $this->postJson('/api/v1/hr/content/entities', companyPayload(['name' => 'Another']))->assertForbidden();
    $this->deleteJson('/api/v1/hr/content/entities/brightlane')->assertForbidden();

    $this->postJson('/api/v1/hr/content/entities/brightlane', ['motto' => 'New motto', 'name' => 'Renamed', 'is_active' => false])->assertOk();
    expect($entity->fresh())->motto->toBe('New motto')->name->toBe('Brightlane')->is_active->toBeTrue();
});

it('deletes a company with no history, and refuses one that has jobs', function () {
    signInAs('Admin');
    Entity::factory()->create(['slug' => 'empty-co']);
    $busy = Entity::factory()->create(['name' => 'Busy Co', 'slug' => 'busy-co']);
    JobPosting::factory()->create(['entity_id' => $busy->id]);

    $this->deleteJson('/api/v1/hr/content/entities/empty-co')->assertNoContent();
    expect(Entity::query()->where('slug', 'empty-co')->exists())->toBeFalse();

    $this->deleteJson('/api/v1/hr/content/entities/busy-co')
        ->assertUnprocessable()
        ->assertJsonPath('errors.entity.0', 'Busy Co has 1 job. Hide it instead, so that history is kept.');
});

it('accepts a JPG logo when editing a company', function () {
    signInAs('HR');
    Entity::factory()->create(['slug' => 'brightlane']);

    $this->post('/api/v1/hr/content/entities/brightlane', ['logo' => UploadedFile::fake()->image('logo.jpg', 300, 300)], ['Accept' => 'application/json'])
        ->assertOk();
});
