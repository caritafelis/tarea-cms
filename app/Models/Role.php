<?php

namespace App\Models;

use Spatie\Permission\Models\Role as SpatieRole;

/**
 * First-party extension point for Spatie's Role model.
 * Only `name`, `guard_name` and (when teams are enabled) the team foreign
 * key exist on the `roles` table in this project.
 */
class Role extends SpatieRole
{
    public function isOwner(): bool
    {
        return $this->name === 'Owner';
    }

    public function isAdmin(): bool
    {
        return in_array($this->name, ['Owner', 'Admin'], true);
    }
}
