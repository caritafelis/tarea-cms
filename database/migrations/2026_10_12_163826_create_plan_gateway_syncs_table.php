
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_gateway_syncs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('plan_id')
                ->constrained('plans')
                ->cascadeOnDelete();

            $table->string('gateway', 30);
            $table->string('environment', 20)->default('sandbox');
            
            $table->string('status', 30)->default('pending');

            $table->string('external_product_id')->nullable();
            $table->string('external_plan_id')->nullable();
            $table->string('external_price_id')->nullable();

            $table->string('configuration_hash', 64)->nullable();

            $table->timestamp('synced_at')->nullable();
            $table->text('last_error')->nullable();

            $table->timestamps();

            $table->unique(
                ['plan_id', 'gateway', 'environment'],
                'plan_gateway_syncs_unique'
            );

            $table->index(['gateway', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_gateway_syncs');
    }
};