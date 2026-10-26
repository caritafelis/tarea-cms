<?php

namespace App\Providers;

use App\Console\SyncCollectionsCommand;
use App\Contracts\InventoryResolver;
use App\Contracts\StockAllocator;
use App\Contracts\StockReserver;
use App\Contracts\TaxCalculationProvider;
use App\Models\Address;
use App\Models\Attribute;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Channel;
use App\Models\Collection;
use App\Models\Discount;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductTag;
use App\Models\ProductVariant;
use App\Models\Supplier;
use App\Models\TaxRate;
use App\Models\TaxZone;
use App\Observers\AddressObserver;
use App\Observers\AttributeObserver;
use App\Observers\CategoryObserver;
use App\Observers\ChannelObserver;
use App\Observers\DiscountObserver;
use App\Observers\InventoryObserver;
use App\Observers\OrderItemObserver;
use App\Observers\OrderObserver;
use App\Observers\ProductObserver;
use App\Observers\ProductVariantObserver;
use App\Services\Stock\DefaultInventoryResolver;
use App\Services\Stock\LockingStockReserver;
use App\Services\Stock\PriorityStockAllocator;
use App\Services\Taxes\SystemTaxProvider;
use App\Services\Taxes\TaxCalculator;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

final class ShopServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(base_path('config/settings.php'), 'settings');
        $this->mergeConfigFrom(base_path('config/orders.php'), 'orders');
        $this->app->register(EventServiceProvider::class);
        $this->registerStockAllocator();
        $this->registerTaxCalculator();
    }

    public function boot(): void
    {
        setlocale(LC_ALL, config('app.locale'));
        Carbon::setLocale(config('app.locale'));
        $this->bootModelRelationName();
        $this->registerObservers();

        if ($this->app->runningInConsole()) {
            $this->commands([
                SyncCollectionsCommand::class,
            ]);
        }
    }

    protected function registerObservers(): void
    {
        Address::observe(AddressObserver::class);
        Category::observe(CategoryObserver::class);
        Channel::observe(ChannelObserver::class);
        Inventory::observe(InventoryObserver::class);
        Order::observe(OrderObserver::class);
        Product::observe(ProductObserver::class);
        ProductVariant::observe(ProductVariantObserver::class);
        Attribute::observe(AttributeObserver::class);
        Discount::observe(DiscountObserver::class);
        OrderItem::observe(OrderItemObserver::class);
    }

    protected function registerStockAllocator(): void
    {
        $this->app->bind(InventoryResolver::class, DefaultInventoryResolver::class);
        $this->app->bind(StockAllocator::class, PriorityStockAllocator::class);
        $this->app->bind(StockReserver::class, LockingStockReserver::class);
    }

    protected function registerTaxCalculator(): void
    {
        $this->app->singleton(TaxCalculationProvider::class, SystemTaxProvider::class);
        $this->app->singleton(TaxCalculator::class);
    }

    protected function bootModelRelationName(): void
    {
        Relation::morphMap([
            'address' => Address::class,
            'brand' => Brand::class,
            'category' => Category::class,
            'collection' => Collection::class,
            'product' => Product::class,
            'variant' => ProductVariant::class,
            'channel' => Channel::class,
            'order' => Order::class,
            'inventory' => Inventory::class,
            'supplier' => Supplier::class,
            'tax_zone' => TaxZone::class,
            'tax_rate' => TaxRate::class,
            'product_tag' => ProductTag::class,
        ]);
    }
}
