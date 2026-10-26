<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_rate_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tax_rate_id')->constrained('tax_rates')->cascadeOnDelete();
            $table->string('reference_type');
            $table->string('reference_id');
            $table->unique(['tax_rate_id', 'reference_type', 'reference_id'], 'tax_rate_rules_reference_unique');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_rate_rules');
    }
};
