<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discountables', function (Blueprint $table): void {
            $table->id();
            $table->string('condition')->nullable();
            $table->unsignedInteger('total_use')->default(0);
            $table->morphs('discountable');
            $table->foreignId('discount_id')->constrained('discounts')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discountables');
    }
};
