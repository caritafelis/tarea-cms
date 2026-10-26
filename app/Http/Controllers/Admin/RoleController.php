<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    private const PLATFORM_ROLE = 'SuperAdmin';

    public function index(string $current_team): Response
    {
        return Inertia::render('admin/roles/index', [
            'roles' => Role::query()
                ->where('team_id', auth()->user()->current_team_id)
                ->where('name', '!=', self::PLATFORM_ROLE)
                ->with('permissions')
                ->withCount('users')
                ->get(),
        ]);
    }

    public function create(string $current_team): Response
    {
        return Inertia::render('admin/roles/create', [
            'permissions' => Permission::query()->get(),
        ]);
    }

    public function store(Request $request, string $current_team)
    {
        $request->validate([
            'name' => ['required','string','max:255',Rule::unique('roles', 'name')->where(
                    fn ($query) => $query->where('team_id',auth()->user()->current_team_id)->where('guard_name', 'web')
                ),],
            'permissions' => ['array'],
        ]);

        $name = trim($request->string('name')->toString());

        if (strcasecmp($name, self::PLATFORM_ROLE) === 0) {
            abort(403, 'The SuperAdmin role is reserved for the platform owner.');
        }

        $role = Role::create([
            'name' => $name,
            'team_id' => auth()->user()->current_team_id,
            'guard_name' => 'web',
        ]);

        if ($request->has('permissions')) {
            $permissions = Permission::query()
                ->whereIn('id', $request->input('permissions', []))
                ->get();

            $role->syncPermissions($permissions);
        }

        return redirect()
            ->route('admin.roles.index', ['current_team' => $current_team])
            ->with('success', 'Role created successfully.');
    }

    public function edit(string $current_team,Role $role): Response 
    {
        $this->ensureTenantRole($role);

        return Inertia::render('admin/roles/edit', [
            'role' => $role->load('permissions'),
            'permissions' => Permission::query()->get(),
        ]);
    }

    public function update(Request $request, string $current_team, Role $role) 
    {
        $this->ensureTenantRole($role);

        $request->validate([
            'name' => ['required','string','max:255',Rule::unique('roles', 'name')->ignore($role->id)->where(
                    fn ($query) => $query->where('team_id',auth()->user()->current_team_id)->where('guard_name', 'web')
                ),
            ],
            'permissions' => ['array'],
        ]);

        $name = trim($request->string('name')->toString());

        if (strcasecmp($name, self::PLATFORM_ROLE) === 0) {
            abort(403, 'The SuperAdmin role is reserved for the platform owner.');
        }

        $role->update([
            'name' => $name,
        ]);

        if ($request->has('permissions')) {
            $permissions = Permission::query()
                ->whereIn('id', $request->input('permissions', []))
                ->get();

            $role->syncPermissions($permissions);
        }

        return redirect()
            ->route('admin.roles.index', ['current_team' => $current_team])
            ->with('success', 'Role updated successfully.');
    }

    public function togglePermission(string $current_team, Role $role, Permission $permission) 
    {
        $this->ensureTenantRole($role);

        if ($role->hasPermissionTo($permission)) {
            $role->revokePermissionTo($permission);
        } else {
            $role->givePermissionTo($permission);
        }

        return back();
    }

    public function destroy(string $current_team, Role $role) 
    {
        $this->ensureTenantRole($role);

        if ($role->name === 'Owner') {
            abort(403, 'The Owner role cannot be deleted.');
        }

        $role->delete();

        return redirect()
            ->route('admin.roles.index', ['current_team' => $current_team])
            ->with('success', 'Role deleted successfully.');
    }

    private function ensureTenantRole(Role $role): void
    {
        if (
            $role->name === self::PLATFORM_ROLE ||
            $role->team_id === null ||
            (int) $role->team_id !== (int) auth()->user()->current_team_id
        ) {
            abort(404);
        }
    }
}