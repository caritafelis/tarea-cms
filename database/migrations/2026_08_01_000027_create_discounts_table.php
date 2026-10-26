<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discounts', function (Blueprint $table): void {
            $table->id();
            $table->boolean('is_active')->default(false);
            $table->string('code')->unique();
            $table->string('type');
            $table->integer('value');
            $table->string('apply_to');
            $table->string('min_required');
            $table->string('min_required_value')->nullable();
            $table->string('eligibility');
            $table->unsignedInteger('usage_limit')->nullable();
            $table->boolean('usage_limit_per_user')->default(false);
            $table->unsignedInteger('total_use')->default(0);
            $table->dateTime('start_at');
            $table->dateTime('end_at')->nullable();
            $table->foreignId('zone_id')->constrained('zones')->cascadeOnDelete();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
