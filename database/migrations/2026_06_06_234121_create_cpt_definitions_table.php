<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cpt_definitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cpt_id');
            $table->foreign('cpt_id', 'fd_cpt_fk')->references('id')->on('cpts')->cascadeOnDelete();
            $table->string('label');
            $table->string('name');
            $table->string('type');
            $table->json('options')->nullable();
            $table->json('settings')->nullable();
            $table->text('instructions')->nullable();
            $table->boolean('required')->default(false);
            $table->string('default_value')->nullable();
            $table->integer('order')->default(0);
            $table->foreignId('parent_id')->nullable();
            $table->foreign('parent_id', 'fd_parent_fk')->references('id')->on('cpt_definitions')->cascadeOnDelete();
            $table->timestamps();
            $table->index(['cpt_id', 'order'], 'fd_group_order_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cpt_definitions');
    }
};
