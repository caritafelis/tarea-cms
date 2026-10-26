<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name')->index();
            $table->string('sku')->nullable();
            $table->string('barcode')->unique()->nullable();
            $table->string('ean')->unique()->nullable();
            $table->string('upc')->unique()->nullable();
            $table->boolean('allow_backorder')->default(false);
            $table->unsignedInteger('position')->default(1);
            $table->decimal('weight', 10, 4)->nullable();
            $table->decimal('height', 10, 4)->nullable();
            $table->decimal('width', 10, 4)->nullable();
            $table->decimal('length', 10, 4)->nullable();
            $table->json('metadata')->nullable();
            $table->unique(['product_id', 'sku']);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
