<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Entitlements;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UserController extends Controller
{
    private const PLATFORM_ROLE = 'SuperAdmin';

    public function index(string $current_team): Response
    {
        $teamId = auth()->user()->current_team_id;

        return Inertia::render('admin/users/index', [
            'users' => fn () => User::query()
                ->whereHas('teams', fn ($q) => $q->where('teams.id', $teamId))
                ->where('is_super_admin', false)
                ->with(['roles' => fn ($q) => $q
                    ->where('roles.name', '!=', self::PLATFORM_ROLE)
                    ->where('roles.team_id', $teamId)])
                ->latest()
                ->paginate(15),

            'roles' => fn () => Role::query()
                ->where('team_id', $teamId)
                ->where('name', '!=', self::PLATFORM_ROLE)
                ->with('permissions:id,name')
                ->get()
                ->each(fn ($role) => $role->permissions->each->makeHidden('pivot')),

            'permissions' => fn () => Permission::query()
                ->where('name', 'not like', 'superadmin%')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function create(string $current_team): Response
    {
        $roles = Role::query()
            ->where('team_id', auth()->user()->current_team_id)
            ->where('name', '!=', self::PLATFORM_ROLE)
            ->get();

        return Inertia::render('admin/users/create', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request, string $current_team): RedirectResponse 
    {
        $validated = $request->validate([
            'name' => ['required','string','max:255'],
            'email' => ['required','string','email','max:255','unique:users,email'],
            'password' => ['required','confirmed',Password::defaults()],
            'roles' => ['array'],
            'roles.*' => ['integer'],
        ]);

        Entitlements::assertWithinLimit(auth()->user()->currentTeam, 'team_members', auth()->user()->currentTeam->members()->count(), 'Team members');

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_super_admin' => false,
        ]);

        $this->attachToCurrentTeam(
            $user,
            $validated['roles'] ?? []
        );

        return redirect()
            ->route('admin.users.index', [
                'current_team' => $current_team,
            ])
            ->with('success', 'User created successfully.');
    }

    public function edit(string $current_team, User $user): Response 
    {
        $this->ensureTenantUser($user);

        $roles = Role::query()
            ->where('team_id', auth()->user()->current_team_id)
            ->where('name', '!=', self::PLATFORM_ROLE)
            ->get();

        return Inertia::render('admin/users/edit', [
            'user' => $user->load('roles'),
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, string $current_team, User $user): RedirectResponse 
    {
        $this->ensureTenantUser($user);

        $validated = $request->validate([
            'name' => ['required','string','max:255',],
            'email' => ['required','string','email','max:255','unique:users,email,'.$user->id,],
            'password' => ['nullable','confirmed',Password::defaults(),],
            'roles' => ['array',],
            'roles.*' => ['integer',],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if (! empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        $this->syncCurrentTeamRoles(
            $user,
            $validated['roles'] ?? []
        );

        return redirect()
            ->route('admin.users.index', ['current_team' => $current_team,])
            ->with('success', 'User updated successfully.');
    }

    public function destroy(string $current_team, User $user): RedirectResponse 
    {
        $this->ensureTenantUser($user);

        if (auth()->id() === $user->id) {
            return back()->with('error','You cannot delete yourself.');
        }

        if ($user->hasRole('Owner')) {
            return back()->with('error','The team owner cannot be deleted.');
        }

        $user->delete();

        return redirect()
            ->route('admin.users.index', ['current_team' => $current_team,])
            ->with('success', 'User deleted successfully.');
    }

    private function ensureTenantUser(User $user): void
    {
        if ($user->is_super_admin) {
            abort(404);
        }

        $teamId = auth()->user()->current_team_id;

        if (
            ! $user->teams()
                ->where('teams.id', $teamId)
                ->exists()
        ) {
            abort(404);
        }
    }

    private function attachToCurrentTeam(User $user, array $roleIds): void 
    {
        $team = auth()->user()->currentTeam;

        if (! $team) {
            abort(403, 'No active team.');
        }

        $roles = Role::query()
            ->where('team_id', $team->id)
            ->where('name', '!=', self::PLATFORM_ROLE)
            ->whereIn('id', $roleIds)
            ->get();

        $team->members()->attach($user->id,['role' => 'Member']);

        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $user->syncRoles($roles);
    }

    private function syncCurrentTeamRoles(User $user, array $roleIds): void 
    {
        $team = auth()->user()->currentTeam;

        if (! $team) {
            abort(403, 'No active team.');
        }

        $roles = Role::query()
            ->where('team_id', $team->id)
            ->where('name', '!=', self::PLATFORM_ROLE)
            ->whereIn('id', $roleIds)
            ->get();

        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $user->syncRoles($roles);
    }
}