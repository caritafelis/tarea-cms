<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_zones', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('country_id')->nullable()->constrained('countries')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('tax_zones')->nullOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained('tax_providers')->nullOnDelete();
            $table->string('name')->nullable();
            $table->string('province_code')->nullable();
            $table->boolean('is_tax_inclusive')->default(false);
            $table->jsonb('metadata')->nullable();
            $table->unique(['country_id', 'province_code']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_zones');
    }
};
