<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('name_official');
            $table->string('region');
            $table->string('subregion')->nullable();
            $table->string('cca2')->unique();
            $table->string('cca3')->unique(); 
            $table->string('flag');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->json('phone_calling_code');
            $table->json('currencies');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};
