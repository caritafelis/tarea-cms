<?php

namespace Database\Seeders;

use App\Models\Team;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    
    protected array $teamPermissions = [
        'update-team',
        'delete-team',
        'add-member',
        'update-member',
        'remove-member',
        'create-invitation',
        'cancel-invitation',
    ];
    
    protected array $actions = [
        'view_any',
        'view',
        'create',
        'update',
        'delete',
        'restore',
        'force_delete',
    ];
    
    protected array $models = [
        'ai_insight',
        'api_key',
        'backup',
        'category',
        'content_section',
        'content_section_value',
        'coupon',
        'cpt',
        'cpt_definition',
        'cpt_entry',
        'media',
        'media_folder',
        'media_library',
        'membership',
        'order',
        'order_item',
        'page',
        'payment',
        'permission',
        'plugin',
        'post',
        'product',
        'role',
        'setting',
        'team_invitation',
        'user',
        'webhook',
        'webhook_log',
        'analytics', 
        'attribute',
        'brand', 
        'carrier', 
        'collection', 
        'country', 
        'currency',
        'discount', 
        'language', 
        'legal', 
        'payment_method', 
        'review', 
        'supplier', 
        'tax_zone', 
        'zone',
    ];
    
    protected array $roleModelAccess = [
        'Owner' => '*',

        'Admin' => [
            'category',
            'content_section',
            'content_section_value',
            'coupon',
            'cpt',
            'cpt_definition',
            'cpt_entry',
            'media',
            'media_folder',
            'media_library',
            'membership',
            'order',
            'order_item',
            'page',
            'payment',
            'permission',
            'plugin',
            'post',
            'product',
            'role',
            'setting',
            'user',
            'webhook',
            'webhook_log',
        ],

        'Member' => [
            'page',
            'post',
            'media',
            'media_folder',
            'media_library',
        ],
    ];

    protected array $roleTeamAccess = [
        'Owner' => [
            'update-team',
            'delete-team',
            'add-member',
            'update-member',
            'remove-member',
            'create-invitation',
            'cancel-invitation',
        ],

        'Admin' => [
            'update-team',
            'add-member',
            'update-member',
            'remove-member',
            'create-invitation',
            'cancel-invitation',
        ],

        'Member' => [],
    ];

    public function run(): void
    {
        $registrar = app(PermissionRegistrar::class);

        $registrar->forgetCachedPermissions();
        
        Role::firstOrCreate(
            [
                'name' => 'SuperAdmin',
                'guard_name' => 'web',
            ],
            [
                'team_id' => null,
            ],
        );

        $modelPermissions = $this->createModelPermissions();

        $this->createTeamPermissions();

        Team::query()->each(function (Team $team) use ($modelPermissions): void {
            $this->seedTeamRoles($team, $modelPermissions);
        });

        $registrar->forgetCachedPermissions();
    }

    protected function createTeamPermissions(): void
    {
        foreach ($this->teamPermissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }
    }

    /**
     * @return array<string, string[]>
     */
    protected function createModelPermissions(): array
    {
        $map = [];

        foreach ($this->models as $model) {
            $map[$model] = [];

            foreach ($this->actions as $action) {
                $name = "{$action}_{$model}";

                Permission::firstOrCreate([
                    'name' => $name,
                    'guard_name' => 'web',
                ]);

                $map[$model][] = $name;
            }
        }

        return $map;
    }

    protected function seedTeamRoles(Team $team, array $modelPermissions): void
    {
        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId($team->id);

        foreach (array_keys($this->roleModelAccess) as $roleName) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'team_id' => $team->id,
                'guard_name' => 'web',
            ]);

            $permissionNames = $this->resolvePermissionNamesForRole(
                $roleName,
                $modelPermissions,
            );

            $permissions = Permission::query()->whereIn('name', $permissionNames)->get();

            $role->syncPermissions($permissions);
        }

        $owner = $team->owner();

        if ($owner) {
            $role = Role::query()
                ->where('name', 'Owner')
                ->where('team_id', $team->id)
                ->where('guard_name', 'web')
                ->first();

            if ($role) {
                app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

                $owner->roles()->syncWithoutDetaching([
                    $role->id => ['team_id' => $team->id]
                ]);
                
                $owner->unsetRelation('roles');
                $owner->unsetRelation('permissions');
            }
        }
    }

    protected function resolvePermissionNamesForRole(string $roleName, array $modelPermissions): array 
    {
        $permissionNames = $this->roleTeamAccess[$roleName] ?? [];

        $modelAccess = $this->roleModelAccess[$roleName] ?? [];

        if ($modelAccess === '*') {
            foreach ($modelPermissions as $names) {
                $permissionNames = array_merge(
                    $permissionNames,
                    $names,
                );
            }
        } else {
            foreach ($modelAccess as $model) {
                $permissionNames = array_merge(
                    $permissionNames,
                    $modelPermissions[$model] ?? [],
                );
            }
        }

        return array_values(array_unique($permissionNames));
    }
}