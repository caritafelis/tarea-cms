<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cpt_id');
            $table->foreign('cpt_id', 'cs_cpt_fk')->references('id')->on('cpts')->cascadeOnDelete();
            $table->foreignId('cpt_entry_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->unsignedBigInteger('sectionable_id');
            $table->string('sectionable_type');
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->index(['sectionable_type', 'sectionable_id'], 'cs_sectionable_idx');
            $table->index(['cpt_id', 'order'], 'cs_group_order_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_sections');
    }
};
