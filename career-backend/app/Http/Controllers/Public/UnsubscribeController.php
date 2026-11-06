<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\TalentMember;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;

/**
 * The token is a 64-character random secret, so it is the only thing needed to manage the subscription.
 * POST also serves mail clients' one-click unsubscribe (RFC 8058), which carries no session or CSRF token.
 */
class UnsubscribeController extends Controller
{
    public function show(string $token, SubscriptionService $subscriptions): JsonResponse
    {
        return $this->respond($subscriptions->find($token) ?? abort(404, 'This link is not valid.'));
    }

    public function unsubscribe(string $token, SubscriptionService $subscriptions): JsonResponse
    {
        $member = $subscriptions->find($token) ?? abort(404, 'This link is not valid.');

        return $this->respond($subscriptions->unsubscribe($member), "You're unsubscribed. You will no longer receive job alerts or company updates.");
    }

    public function resubscribe(string $token, SubscriptionService $subscriptions): JsonResponse
    {
        $member = $subscriptions->find($token) ?? abort(404, 'This link is not valid.');

        return $this->respond($subscriptions->resubscribe($member), "Welcome back! You'll receive job alerts and company updates again.");
    }

    private function respond(TalentMember $member, ?string $message = null): JsonResponse
    {
        $name = trim((string) $member->name);

        return response()->json([
            'message' => $message,
            'data' => [
                'first_name' => $name !== '' ? strtok($name, ' ') : null,
                'email_hint' => $this->mask((string) $member->email),
                'is_subscribed' => $member->is_subscribed,
            ],
        ]);
    }

    private function mask(string $email): string
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');

        return mb_substr($local, 0, 2).str_repeat('•', max(1, mb_strlen($local) - 2)).'@'.$domain;
    }
}
