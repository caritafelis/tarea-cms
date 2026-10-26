<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

final class RolesTableSeeder extends Seeder
{
    /**
     * No-op: roles are team-scoped (config('permission.teams') === true),
     * so a global "Owner"/"Admin"/"Member" role no longer makes sense here.
     * Each team's roles are provisioned when the team is created, in
     * App\Actions\Teams\CreateTeam::handle().
     */
    public function run(): void
    {
        //
    }
}
