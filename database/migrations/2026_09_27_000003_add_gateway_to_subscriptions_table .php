<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('gateway')->default('stripe')->after('user_id');
            $table->foreignId('plan_id')->nullable()->after('gateway')->constrained()->nullOnDelete();
            $table->boolean('auto_renew')->default(true)->after('quantity');

            $table->index(['user_id', 'gateway']);
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('plan_id');
            $table->dropColumn(['gateway', 'auto_renew']);
        });
    }
};