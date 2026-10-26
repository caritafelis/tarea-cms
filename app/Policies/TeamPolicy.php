<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Team $team): bool
    {
        return $user->belongsToTeam($team);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, 'update-team');
    }

    public function addMember(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, 'add-member');
    }

    public function updateMember(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, 'update-member');
    }

    public function removeMember(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, 'remove-member');
    }

    public function inviteMember(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, 'create-invitation');
    }

    public function cancelInvitation(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, 'cancel-invitation');
    }

    public function delete(User $user, Team $team): bool
    {
        return !$team->is_personal && $user->hasTeamPermission($team, 'delete-team');
    }
}