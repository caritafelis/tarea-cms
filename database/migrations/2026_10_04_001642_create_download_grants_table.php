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
        Schema::create('download_grants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->unsignedInteger('downloads_count')->default(0);
            $table->unsignedInteger('download_limit')->nullable();
            $table->timestampTz('expires_at')->nullable();
            $table->timestamps();
            $table->unique(['order_item_id', 'media_id',]);
            $table->index(['order_id',]);
            $table->index(['expires_at',]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('download_grants');
    }
};
