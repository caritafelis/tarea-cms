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
        Schema::create('product_links', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('linked_product_id')->constrained('products')->cascadeOnDelete();
            $table->string('type', 20);
            $table->unsignedInteger('position')->default(0);
            $table->unique(['product_id', 'linked_product_id', 'type',]);
            $table->timestamps();

            $table->index(['product_id', 'type',]);
            $table->index(['linked_product_id', 'type',]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_links');
    }
};
