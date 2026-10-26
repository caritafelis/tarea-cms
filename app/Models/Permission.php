<?php

namespace App\Models;

use Spatie\Permission\Models\Permission as SpatiePermission;

/**
 * First-party extension point for Spatie's Permission model.
 * Only `name` and `guard_name` exist on the `permissions` table in this
 * project - do not reference columns from third-party Shopper migrations
 * (group_name, display_name, description, can_be_removed) here.
 */
class Permission extends SpatiePermission
{
    /**
     * Generate the standard CRUD permission set for a given resource,
     * e.g. Permission::generate('products') creates
     * view_any_products, view_products, create_products, update_products,
     * delete_products, restore_products, force_delete_products.
     */
    public static function generate(string $item): void
    {
        foreach (['view_any', 'view', 'create', 'update', 'delete', 'restore', 'force_delete'] as $action) {
            self::query()->firstOrCreate([
                'name' => "{$action}_{$item}",
                'guard_name' => config('auth.defaults.guard', 'web'),
            ]);
        }
    }
}
