<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->string('tier')->after('slug');
            $table->boolean('has_ecommerce')->default(false)->after('tier');
            $table->json('entitlements')->nullable();
            $table->unique(['tier', 'has_ecommerce', 'interval']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->foreignId('team_id')->nullable()->after('user_id')->constrained()->cascadeOnDelete();
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->timestamp('onboarding_completed_at')->nullable();
            $table->string('onboarding_step')->default('business');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['tier', 'has_ecommerce', 'entitlements']);
            $table->dropUnique(['tier', 'has_ecommerce', 'interval']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropForeign(['team_id']);
            $table->dropColumn('team_id');
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn(['onboarding_completed_at', 'onboarding_step']);
        });
    }
};
