<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hr\HrUserRequest;
use App\Http\Requests\Hr\RoleMatrixRequest;
use App\Models\User;
use App\Services\HrUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request, HrUserService $users): JsonResponse
    {
        $this->authorize('viewAny', User::class);
        $filters = $request->validate(['q' => ['nullable', 'string', 'max:100'], 'role' => ['nullable', 'string'], 'active' => ['nullable', 'boolean']]);
        $page = $users->list($filters);

        return response()->json([
            'data' => collect($page->items())->map(fn (User $user) => $this->present($user, $request->user())),
            'meta' => ['total' => $page->total(), 'current_page' => $page->currentPage(), 'last_page' => $page->lastPage()],
        ]);
    }

    public function store(HrUserRequest $request, HrUserService $users): JsonResponse
    {
        $this->authorize('create', User::class);

        return response()->json(['data' => $this->present($users->invite($request->validated(), $request->user()), $request->user())], 201);
    }

    public function update(HrUserRequest $request, User $user, HrUserService $users): JsonResponse
    {
        $this->authorize('update', $user);

        return response()->json(['data' => $this->present($users->update($user, $request->validated(), $request->user()), $request->user())]);
    }

    public function toggleActive(Request $request, User $user, HrUserService $users): JsonResponse
    {
        $this->authorize('update', $user);
        $active = $request->validate(['is_active' => ['required', 'boolean']])['is_active'];

        return response()->json(['data' => $this->present($users->setActive($user, (bool) $active, $request->user()), $request->user())]);
    }

    public function resetTwoFactor(Request $request, User $user, HrUserService $users): JsonResponse
    {
        $this->authorize('update', $user);

        return response()->json(['data' => $this->present($users->resetTwoFactor($user, $request->user()), $request->user())]);
    }

    public function resendInvite(Request $request, User $user, HrUserService $users): JsonResponse
    {
        $this->authorize('update', $user);
        $users->resendInvite($user, $request->user());

        return response()->json(['message' => 'Invitation sent again.']);
    }

    public function roles(HrUserService $users): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        return response()->json(['data' => $users->matrix()]);
    }

    public function saveRoles(RoleMatrixRequest $request, HrUserService $users): JsonResponse
    {
        $this->authorize('update', User::class);

        return response()->json(['data' => $users->saveMatrix($request->validated('roles'))]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(User $user, User $viewer): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->roles->first()?->name,
            'is_active' => $user->is_active,
            'two_factor_enabled' => $user->two_factor_confirmed_at !== null,
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'invited' => $user->last_login_at === null,
            'is_me' => $user->is($viewer),
        ];
    }
}
