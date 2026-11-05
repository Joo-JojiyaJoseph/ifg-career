<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class SpamProtectionService
{
    public function assertHuman(Request $request): void
    {
        if (filled($request->input('company_website'))) {
            throw ValidationException::withMessages([
                'application' => 'That submission could not be accepted.',
            ]);
        }

        $secret = config('services.turnstile.secret');

        if (blank($secret)) {
            return;
        }

        try {
            $response = Http::asForm()
                ->timeout(5)
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $secret,
                    'response' => (string) $request->input('turnstile_token'),
                    'remoteip' => $request->ip(),
                ]);
        } catch (ConnectionException) {
            throw ValidationException::withMessages([
                'turnstile_token' => 'Confirm you are not a robot and try again.',
            ]);
        }

        if (! $response->ok() || $response->json('success') !== true) {
            throw ValidationException::withMessages([
                'turnstile_token' => 'Confirm you are not a robot and try again.',
            ]);
        }
    }
}
