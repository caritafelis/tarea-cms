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
        Schema::table('products', function (Blueprint $table): void {
            $table->string('gtin', 14)->nullable()->index();
            $table->string('mpn')->nullable();
        });

        Schema::create('external_ids', function (Blueprint $table): void {
            $table->id();
            $table->morphs('syncable');
            $table->string('platform', 50);
            $table->string('external_id');
            $table->string('external_sku')->nullable();
            $table->string('status', 20)->default('synced');
            $table->text('last_error')->nullable();
            $table->timestampTz('last_synced_at')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
            $table->unique(['syncable_type', 'syncable_id', 'platform']);
            $table->index(['platform', 'external_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('external_ids');

        Schema::table('products', function (Blueprint $table): void  {
            $table->dropColumn(['gtin', 'mpn']);
        });
    }
};
