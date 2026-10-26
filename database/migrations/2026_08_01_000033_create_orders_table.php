<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->string('number', 32);
            $table->integer('price_amount')->nullable();
            $table->integer('tax_amount')->unsigned()->nullable();
            $table->unsignedInteger('shipping_amount')->default(0);
            $table->string('status', 32);
            $table->string('payment_status', 32)->default('pending');
            $table->string('shipping_status', 32)->default('unfulfilled');
            $table->string('currency_code');
            $table->text('notes')->nullable();
            $table->foreignId('parent_order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods')->nullOnDelete();
            $table->foreignId('channel_id')->nullable()->constrained('channels')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('zone_id')->nullable()->constrained('zones')->nullOnDelete();
            $table->foreignId('billing_address_id')->nullable()->constrained('order_addresses')->nullOnDelete();
            $table->foreignId('shipping_address_id')->nullable()->constrained('order_addresses')->nullOnDelete();
            $table->foreignId('shipping_option_id')->nullable()->constrained('carrier_options')->nullOnDelete();
            $table->foreignId('discount_id')->nullable()->constrained('discounts')->nullOnDelete();
            $table->string('discount_code')->nullable();
            $table->string('discount_type', 32)->nullable();
            $table->unsignedInteger('discount_value_at_apply')->nullable();
            $table->char('discount_currency_code', 3)->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->index(['payment_status', 'currency_code', 'created_at',]);
            $table->index(['status', 'created_at',]);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};