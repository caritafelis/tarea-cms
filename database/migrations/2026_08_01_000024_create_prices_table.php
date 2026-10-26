<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prices', function (Blueprint $table): void {
            $table->id();
            $table->morphs('priceable');
            $table->unsignedInteger('amount')->nullable()->index();
            $table->unsignedInteger('compare_amount')->nullable();
            $table->unsignedInteger('cost_amount')->nullable();
            $table->unsignedInteger('sale_amount')->nullable();
            $table->timestampTz('sale_starts_at')->nullable();
            $table->timestampTz('sale_ends_at')->nullable();
            $table->foreignId('currency_id')->constrained('currencies')->cascadeOnDelete();
            $table->timestamps();            
            $table->index(['currency_id']);
            $table->index(['sale_starts_at', 'sale_ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prices');
    }
};