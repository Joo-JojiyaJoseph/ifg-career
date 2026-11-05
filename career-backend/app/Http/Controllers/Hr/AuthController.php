<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hr\ForgotPasswordRequest;
use App\Http\Requests\Hr\LoginRequest;
use App\Http\Requests\Hr\ResetPasswordRequest;
use App\Http\Requests\Hr\TwoFactorChallengeRequest;
use App\Http\Resources\UserResource;
use App\Services\HrAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    public function login(LoginRequest $request, HrAuthService $auth): JsonResponse
    {
        $result = $auth->login(
            $request->string('email')->toString(),
            $request->string('password')->toString(),
            $request->boolean('remember'),
            (string) $request->ip(),
        );

        return $this->authResponse($result);
    }

    public function setup(HrAuthService $auth): JsonResponse
    {
        return response()->json(['data' => $auth->beginSetup()]);
    }

    public function confirm(TwoFactorChallengeRequest $request, HrAuthService $auth): JsonResponse
    {
        return $this->authResponse($auth->confirmSetup($request->string('code')->toString(), (string) $request->ip()));
    }

    public function challenge(TwoFactorChallengeRequest $request, HrAuthService $auth): JsonResponse
    {
        return $this->authResponse($auth->challenge($request->string('code')->toString(), (string) $request->ip()));
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::broker('users')->sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'If that email belongs to an HR account, a reset link is on its way.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::broker('users')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'failed_login_attempts' => 0,
                    'locked_until' => null,
                ])->save();
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'That reset link is invalid or has expired.',
                'code' => 'reset_failed',
            ], 422);
        }

        return response()->json(['message' => 'Your password has been updated.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request, HrAuthService $auth): JsonResponse
    {
        $auth->logout();

        return response()->json(['message' => 'Signed out.']);
    }

    private function authResponse(array $result): JsonResponse
    {
        $payload = ['status' => $result['status']];

        if (isset($result['user'])) {
            $payload['data'] = new UserResource($result['user']);
        }

        if (isset($result['recovery_codes'])) {
            $payload['recovery_codes'] = $result['recovery_codes'];
        }

        return response()->json($payload);
    }
}
