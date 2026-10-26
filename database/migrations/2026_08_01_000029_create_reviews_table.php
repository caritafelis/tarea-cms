<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table): void {
            $table->id();
            $table->boolean('is_recommended')->default(false);
            $table->integer('rating');
            $table->text('title')->nullable();
            $table->text('content')->nullable();
            $table->boolean('approved')->default(false);
            $table->morphs('reviewrateable');
            $table->morphs('author');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
