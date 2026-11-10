<?php

use App\Support\GoogleRedirectCheck;
use Tests\TestCase;

uses(TestCase::class);

it('accepts localhost and public https return addresses', function (string $uri) {
    expect(GoogleRedirectCheck::problem($uri))->toBeNull();
})->with([
    'http://localhost:5173/api/v1/auth/google/callback',
    'http://127.0.0.1:8000/api/v1/auth/google/callback',
    'https://careers.infolksgroup.com/api/v1/auth/google/callback',
]);

it('explains addresses Google refuses', function (string $uri, string $says) {
    expect(GoogleRedirectCheck::problem($uri))->toContain($says);
})->with([
    ['http://career-backend.test/api/v1/auth/google/callback', '.test'],
    ['https://career-backend.test/api/v1/auth/google/callback', '.test'],
    ['http://192.168.1.20/api/v1/auth/google/callback', 'IP numbers'],
    ['http://careers.infolksgroup.com/api/v1/auth/google/callback', 'https://'],
    ['/api/v1/auth/google/callback', 'full web address'],
]);

it('sends candidates back with a clear message instead of to Google when the address would be blocked', function () {
    config([
        'services.google.client_id' => 'id',
        'services.google.client_secret' => 'secret',
        'services.google.redirect' => 'http://career-backend.test/api/v1/auth/google/callback',
        'app.frontend_careers_url' => 'http://localhost:5173',
    ]);

    $this->get('/api/v1/auth/google/redirect')->assertRedirect('http://localhost:5173/?auth_error=google_redirect_invalid');

    config(['services.google.redirect' => 'http://localhost:5173/api/v1/auth/google/callback']);
    expect($this->get('/api/v1/auth/google/redirect')->headers->get('Location'))->toStartWith('https://accounts.google.com/');
});
