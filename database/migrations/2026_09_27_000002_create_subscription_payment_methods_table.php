<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('gateway');
            $table->string('gateway_payment_method_id');
            $table->string('type')->default('card');
            $table->string('brand')->nullable();
            $table->string('cardholder_name')->nullable();
            $table->string('last_four', 4)->nullable();
            $table->unsignedTinyInteger('exp_month')->nullable();
            $table->unsignedSmallInteger('exp_year')->nullable();
            
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'gateway']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_payment_methods');
    }
};
