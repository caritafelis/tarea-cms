<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

final class PermissionRoleTableSeeder extends Seeder
{
    /**
     * No-op: role<->permission assignment is team-scoped and is handled
     * per team from the admin Roles UI (App\Http\Controllers\Admin\RoleController),
     * after App\Actions\Teams\CreateTeam::handle() provisions the team's Owner role.
     */
    public function run(): void
    {
        //
    }
}
