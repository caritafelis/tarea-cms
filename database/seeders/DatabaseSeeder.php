<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        /*
         * -------------------------------------------------------------
         * 1. CORE DATA
         * -------------------------------------------------------------
         */

        $this->call([
            CurrenciesTableSeeder::class,
            CountriesTableSeeder::class,
            ChannelSeeder::class,
            CarrierSeeder::class,
            LegalsPageTableSeeder::class,

        ]);

        /*
         * -------------------------------------------------------------
         * 2. PLATFORM USER
         * -------------------------------------------------------------
         *
         * is_super_admin is the authoritative platform flag.
         * The Spatie SuperAdmin role is an internal authorization role.
         */

        $admin = User::query()->firstOrCreate(
            ['email' => 'itsupport@stuvvion.com'],
            ['name' => 'Stuvvion', 'password' => Hash::make(env('SUPERADMIN_PASSWORD'))],
        );

        // $admin->forceFill([
        //     'is_super_admin' => true,
        //     'email_verified_at' => $admin->email_verified_at ?? now(),
        // ])->save();

        if (! $admin->is_super_admin) {
             $admin->forceFill([
                'is_super_admin' => true,
                'email_verified_at' => $admin->email_verified_at ?? now(),
            ])->save();
        }

        /*
         * -------------------------------------------------------------
         * 3. TENANT
         * -------------------------------------------------------------
         */

        $team = Team::query()->firstOrCreate(
            [
                'slug' => 'stuvvion',
            ],
            [
                'name' => 'STUVVION',
                'is_personal' => false,
            ],
        );

        $team->forceFill([
            'business_type' => 'agency',
            'project_type' => 'sales_services',
            'onboarding_completed_at' => $team->onboarding_completed_at ?? now(),
        ])->save();

        /*
         * -------------------------------------------------------------
         * 4. TEAM MEMBERSHIP
         * -------------------------------------------------------------
         */

        if (! $team->members()->where('user_id', $admin->id)->exists()) {
            $team->members()->attach($admin->id, ['role' => 'Owner',]);
        }

        if (! $admin->current_team_id) {
            $admin->forceFill(['current_team_id' => $team->id,])->save();
        }

        /*
         * -------------------------------------------------------------
         * 5. ROLES + PERMISSIONS
         * -------------------------------------------------------------
         */

        $this->call(RolesAndPermissionsSeeder::class);

        /*
         * -------------------------------------------------------------
         * 6. SUPERADMIN ROLE
         * -------------------------------------------------------------
         */

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        $superAdminRole = Role::query()
            ->where('name', 'SuperAdmin')
            ->where('guard_name', 'web')
            ->firstOrFail();

        if (! $admin->hasRole($superAdminRole)) {
            
            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
            
            $admin->unsetRelation('roles');
            $admin->unsetRelation('permissions');
            $admin->roles()->syncWithoutDetaching([
                $superAdminRole->id => ['team_id' => $team->id]
            ]);
            
            $admin->unsetRelation('roles');
            $admin->unsetRelation('permissions');
        }

        /*
         * -------------------------------------------------------------
         * 7. OWNER ROLE
         * -------------------------------------------------------------
         */

        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $ownerRole = Role::query()
            ->where('name', 'Owner')
            ->where('team_id', $team->id)
            ->where('guard_name', 'web')
            ->firstOrFail();

        if (! $admin->hasRole($ownerRole)) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
            
            $admin->unsetRelation('roles');
            $admin->unsetRelation('permissions');
            $admin->assignRole($ownerRole);
        }

        /*
         * -------------------------------------------------------------
         * 8. STAFF USER
         * -------------------------------------------------------------
         *
         * This user is NOT a SuperAdmin.
         */

        $staff = User::query()->firstOrCreate(
            [
                'email' => 'staff@stuvvion.com',
            ],
            [
                'name' => 'Admin',
                'password' => Hash::make('JwUbRm_u$kT9Xh%'),
                'is_super_admin' => false,
            ],
        );

        if ($staff->is_super_admin) {
            $staff->forceFill(['is_super_admin' => false,])->save();
        }

        if (! $team->members()->where('user_id', $staff->id)->exists()) {
            $team->members()->attach($staff->id,['role' => 'Member',],);
        }

        if (! $staff->current_team_id) {
            $staff->forceFill(['current_team_id' => $team->id,])->save();
        }

        /*
         * -------------------------------------------------------------
         * 9. STAFF TEAM ROLE
         * -------------------------------------------------------------
         */

        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $memberRole = Role::query()
            ->where('name', 'Member')
            ->where('team_id', $team->id)
            ->where('guard_name', 'web')
            ->firstOrFail();

        $staff->syncRoles([
            $memberRole,
        ]);

        /*
         * -------------------------------------------------------------
         * 10. PLANS
         * -------------------------------------------------------------
         */

        $this->call(PlanSeeder::class);
        $this->call(CorporateSiteSeeder::class);

        /*
         * Restore a neutral permission context.
         */

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}