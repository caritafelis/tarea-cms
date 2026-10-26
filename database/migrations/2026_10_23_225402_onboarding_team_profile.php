<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('signup_plan')->nullable()->after('email');
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->string('organization_type', 20)->default('company');
            $table->text('billing_address')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('icon_path')->nullable();
        });

        Schema::table('cpts', function (Blueprint $table) {
            $table->dropUnique('cpts_slug_unique');
            $table->unique(['team_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::table('cpts', function (Blueprint $table) {
            $table->dropUnique(['team_id', 'slug']);
            $table->unique('slug');
        });
        Schema::table('teams', fn (Blueprint $table) => $table->dropColumn(['organization_type', 'billing_address', 'tax_id', 'icon_path']));
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('signup_plan'));
    }
};