<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_tax_lines', function (Blueprint $table): void {
            $table->id();
            $table->morphs('taxable');
            $table->string('code');
            $table->string('name');
            $table->decimal('rate', 8, 4);
            $table->integer('amount')->unsigned()->default(0);
            $table->foreignId('tax_rate_id')->nullable()->constrained('tax_rates')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_tax_lines');
    }
};
