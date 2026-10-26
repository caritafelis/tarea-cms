<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table): void {
            // What kind of business this team/site represents (mirrors the
            // "site type" choice hosting providers ask for on WordPress).
            $table->string('business_type')->nullable()->after('is_personal');

            // The hosting/plan tier chosen for this team, analogous to the
            // hosting plans WordPress hosts offer (shared, business, etc.).
            $table->string('hosting_plan')->nullable()->after('business_type');

            // Whether the team is building a corporate/brochure site or a
            // sales/services (e-commerce-style) project.
            $table->string('project_type')->nullable()->after('hosting_plan');
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table): void {
            $table->dropColumn(['business_type', 'hosting_plan', 'project_type']);
        });
    }
};
