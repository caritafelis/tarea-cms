<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_shipping_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_shipping_id')->constrained('order_shipping')->cascadeOnDelete();
            $table->string('status', 32);
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->decimal('latitude', 11, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->dateTimeTz('occurred_at');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_shipping_events');
    }
};
