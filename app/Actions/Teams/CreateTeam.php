<?php

namespace App\Actions\Teams;

use App\Enums\BusinessType;
use App\Enums\HostingPlan;
use App\Enums\ProjectType;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class CreateTeam
{
    public function handle(
        User $user,
        string $name,
        bool $isPersonal = false,
        ?BusinessType $businessType = null,
        ?HostingPlan $hostingPlan = null,
        ?ProjectType $projectType = null,
    ): Team {
        return DB::transaction(function () use ($user, $name, $isPersonal, $businessType, $hostingPlan, $projectType) {
            $team = Team::create([
                'name' => $name,
                'is_personal' => $isPersonal,
                'business_type' => $businessType,
                'hosting_plan' => $hostingPlan,
                'project_type' => $projectType,
            ]);

            $team->memberships()->create([
                'user_id' => $user->id,
                'role' => 'Owner',
            ]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

            $ownerRole = Role::firstOrCreate(
                ['name' => 'Owner', 'team_id' => $team->id],
                ['guard_name' => 'web']
            );

            $user->assignRole($ownerRole);
            $user->switchTeam($team);

            return $team;
        });
    }
}
