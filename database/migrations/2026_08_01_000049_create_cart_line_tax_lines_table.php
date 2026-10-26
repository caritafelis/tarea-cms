<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_line_tax_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('cart_line_id')->constrained('cart_lines')->cascadeOnDelete();
            $table->foreignId('tax_rate_id')->nullable()->constrained('tax_rates')->nullOnDelete();
            $table->string('code');
            $table->string('name');
            $table->decimal('rate', 8, 4);
            $table->unsignedInteger('amount')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_line_tax_lines');
    }
};
