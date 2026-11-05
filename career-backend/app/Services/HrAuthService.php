<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\HrNewDeviceLogin;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class HrAuthService
{
    public function __construct(private readonly Google2FA $google2fa) {}

    /**
     * @return array{status: string, user?: User, recovery_codes?: list<string>}
     */
    public function login(string $email, string $password, bool $remember, string $ip): array
    {
        $user = User::query()->where('email', $email)->first();

        if ($user && $user->locked_until?->isFuture()) {
            throw ValidationException::withMessages([
                'email' => 'This account is locked. Try again later.',
            ]);
        }

        $passwordMatches = $user && Hash::check($password, $user->password);

        if (! $user || ! $user->is_active || ! $passwordMatches) {
            if ($user && $user->is_active && ! $passwordMatches) {
                $attempts = $user->failed_login_attempts + 1;
                $user->forceFill([
                    'failed_login_attempts' => $attempts,
                    'locked_until' => $attempts >= 5 ? now()->addMinutes(15) : null,
                ])->save();
            }

            throw ValidationException::withMessages([
                'email' => 'Those details do not match an HR account.',
            ]);
        }

        $user->forceFill([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ])->save();

        session([
            'hr.pending_user_id' => $user->id,
            'hr.pending_remember' => $remember,
            'hr.pending_ip' => $ip,
        ]);

        if ($user->isAdmin() && $user->two_factor_confirmed_at === null) {
            return ['status' => 'two_factor_setup_required'];
        }

        if ($user->two_factor_confirmed_at !== null) {
            return ['status' => 'two_factor_required'];
        }

        return ['status' => 'authenticated', 'user' => $this->completeLogin($user, $remember, $ip)];
    }

    /**
     * @return array{secret: string, qr_svg: string}
     */
    public function beginSetup(): array
    {
        $user = $this->pendingUser();
        $secret = $this->google2fa->generateSecretKey();
        session(['hr.pending_secret' => $secret]);

        $otpauth = $this->google2fa->getQRCodeUrl('Infolks Group HR', $user->email, $secret);
        $writer = new Writer(new ImageRenderer(new RendererStyle(192), new SvgImageBackEnd));

        return [
            'secret' => $secret,
            'qr_svg' => $writer->writeString($otpauth),
        ];
    }

    /**
     * @return array{status: string, user: User, recovery_codes: list<string>}
     */
    public function confirmSetup(string $code, string $ip): array
    {
        $user = $this->pendingUser();
        $secret = session('hr.pending_secret');

        if (! is_string($secret) || ! $this->google2fa->verifyKey($secret, $code)) {
            throw ValidationException::withMessages([
                'code' => 'That authenticator code is not valid.',
            ]);
        }

        $recoveryCodes = collect(range(1, 8))->map(fn () => Str::lower(Str::random(10)))->all();

        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => $recoveryCodes,
            'two_factor_confirmed_at' => now(),
        ])->save();

        session()->forget('hr.pending_secret');

        return [
            'status' => 'authenticated',
            'user' => $this->completeLogin($user, (bool) session('hr.pending_remember'), $ip),
            'recovery_codes' => $recoveryCodes,
        ];
    }

    /**
     * @return array{status: string, user: User}
     */
    public function challenge(string $code, string $ip): array
    {
        $user = $this->pendingUser();

        if (! $this->codeIsValid($user, $code)) {
            throw ValidationException::withMessages([
                'code' => 'That authenticator code is not valid.',
            ]);
        }

        return [
            'status' => 'authenticated',
            'user' => $this->completeLogin($user, (bool) session('hr.pending_remember'), $ip),
        ];
    }

    public function logout(): void
    {
        Auth::guard('web')->logout();
        session()->invalidate();
        session()->regenerateToken();
    }

    private function completeLogin(User $user, bool $remember, string $ip): User
    {
        $previousIp = $user->last_login_ip;

        session()->regenerate();
        Auth::guard('web')->login($user, $remember);
        session(['hr.last_activity' => now()->toIso8601String()]);
        session()->forget(['hr.pending_user_id', 'hr.pending_remember', 'hr.pending_ip', 'hr.pending_secret']);

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ])->save();

        if (filled($previousIp) && $previousIp !== $ip) {
            $user->notify(new HrNewDeviceLogin($ip));
        }

        $user->refresh();

        return $user;
    }

    private function pendingUser(): User
    {
        $user = User::query()->find(session('hr.pending_user_id'));

        if (! $user || ! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'Sign in again to continue.',
            ]);
        }

        return $user;
    }

    private function codeIsValid(User $user, string $code): bool
    {
        $normalized = Str::lower(trim($code));
        $recoveryCodes = $user->two_factor_recovery_codes ?? [];

        if (in_array($normalized, $recoveryCodes, true)) {
            $user->forceFill([
                'two_factor_recovery_codes' => array_values(array_diff($recoveryCodes, [$normalized])),
            ])->save();

            return true;
        }

        return is_string($user->two_factor_secret)
            && $this->google2fa->verifyKey($user->two_factor_secret, preg_replace('/\s+/', '', $code) ?? '');
    }
}
