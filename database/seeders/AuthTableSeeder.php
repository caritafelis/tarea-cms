<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\PermissionRegistrar;

final class AuthTableSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->call([
            RolesTableSeeder::class,
            PermissionsTableSeeder::class,
            PermissionRoleTableSeeder::class,
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Schema::enableForeignKeyConstraints();
    }
}