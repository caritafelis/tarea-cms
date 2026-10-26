<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cpt_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cpt_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['cpt_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cpt_entries');
    }
};
