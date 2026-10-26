<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->softDeletes();

            // Basic information
            $table->string('name');
            $table->string('type')->nullable();
            $table->string('slug')->unique()->nullable();
            $table->string('sku')->unique()->nullable();
            $table->string('barcode')->unique()->nullable();
            $table->string('external_id')->nullable();
            $table->text('summary')->nullable();
            $table->longText('description')->nullable();

            // Relations
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();

            // Inventory
            $table->boolean('manage_stock')->default(true);
            $table->string('stock_status', 20)->default('instock');
            $table->integer('security_stock')->nullable()->default(0);
            $table->unsignedInteger('min_qty')->default(0);
            $table->unsignedInteger('max_qty')->default(0);
            $table->boolean('sold_individually')->default(false);
            $table->boolean('allow_backorder')->default(false);

            // Dimensions
            $table->decimal('weight_value', 12, 4)->nullable();
            $table->string('weight_unit', 16)->nullable();
            $table->decimal('width_value', 12, 4)->nullable();
            $table->string('width_unit', 16)->nullable();
            $table->decimal('height_value', 12, 4)->nullable();
            $table->string('height_unit', 16)->nullable();
            $table->decimal('depth_value', 12, 4)->nullable();
            $table->string('depth_unit', 16)->nullable();
            $table->decimal('volume_value', 12, 4)->nullable();
            $table->string('volume_unit', 16)->nullable();

            // Tax
            $table->string('tax_status', 20)->default('taxable');
            $table->string('tax_class')->nullable();

            // Shipping
            $table->boolean('shipping_enabled')->default(true);
            $table->boolean('shipping_free')->default(false);
            $table->boolean('ship_internationally')->default(true);
            $table->boolean('shipping_requires_box')->default(false);
            $table->string('shipping_class')->nullable();
            $table->char('shipping_origin_country', 2)->nullable();

            // Catalog
            $table->string('catalog_visibility', 20)->default('visible');
            $table->integer('menu_order')->default(0);

            // Product flags
            $table->boolean('featured')->default(false);
            $table->boolean('is_visible')->default(false);
            $table->boolean('enable_reviews')->default(true);

            // Publishing
            $table->dateTimeTz('published_at')->nullable();

            // Downloads
            $table->text('purchase_note')->nullable();
            $table->unsignedInteger('download_limit')->nullable();
            $table->unsignedInteger('download_expiry_days')->nullable();

            // Additional data
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['catalog_visibility','menu_order',]);
            $table->index(['stock_status',]);
            $table->index(['brand_id','supplier_id',]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};