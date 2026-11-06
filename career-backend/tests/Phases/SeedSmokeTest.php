<?php

use App\Models\Entity;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('migrates and seeds the demo data', function () {
    $this->seed(DatabaseSeeder::class);

    expect(Entity::count())->toBe(4)
        ->and(JobPosting::count())->toBeGreaterThan(0)
        ->and(User::count())->toBeGreaterThan(0);
});
