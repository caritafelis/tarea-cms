<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            if (! Schema::hasColumn('plans', 'gateway_ids')) {
                $table->json('gateway_ids')->nullable();
            }
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('subscriptions', 'team_id')) {
                $table->foreignId('team_id')->nullable()->constrained()->cascadeOnDelete();
            }
            if (! Schema::hasColumn('subscriptions', 'renews_at')) {
                $table->timestamp('renews_at')->nullable();
            }
            if (! Schema::hasColumn('subscriptions', 'renewal_attempts')) {
                $table->unsignedTinyInteger('renewal_attempts')->default(0);
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            if (! Schema::hasColumn('invoices', 'gateway_reference')) {
                $table->string('gateway_reference')->nullable()->unique();
            }
        });
    }

    public function down(): void {}
};