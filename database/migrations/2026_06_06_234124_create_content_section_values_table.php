<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_section_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_section_id');
            $table->foreign('content_section_id', 'csv_content_section_fk')->references('id')->on('content_sections')->cascadeOnDelete();
            $table->foreignId('cpt_definition_id');
            $table->foreign('cpt_definition_id', 'csv_cpt_definition_fk')->references('id')->on('cpt_definitions')->cascadeOnDelete();
            $table->unsignedInteger('row_index')->default(0);
            $table->longText('value')->nullable();
            $table->timestamps();
            $table->index(['content_section_id', 'cpt_definition_id', 'row_index'], 'csv_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_section_values');
    }
};
