<?php

namespace App\Services\Cart;

use App\Concerns\Core\HasRegisterConfigAndMigrationFiles;
use App\Console\PruneCartsCommand;
use App\Models\Cart\Cart;
use App\Models\Cart\Cart as CartContract;
use App\Models\Cart\CartLine;
use App\Models\Cart\CartLine as CartLineContract;
use App\Services\Cart\Discounts\DiscountCalculator;
use App\Services\Cart\Discounts\DiscountValidator;
use App\Services\Cart\Pipelines\CartPipelineRunner;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

final class CartServiceProvider extends PackageServiceProvider
{
    use HasRegisterConfigAndMigrationFiles;

    /** @var string[] */
    protected array $configFiles = [
        'cart',
    ];

    protected string $root = __DIR__.'/..';

    public function configurePackage(Package $package): void
    {
        $package->name('shopper-cart')
            ->hasTranslations()
            ->hasCommand(PruneCartsCommand::class);
    }

    public function packageRegistered(): void
    {
        $this->registerConfigFiles();
        $this->registerDatabase();
        $this->registerModelBindings();

        $this->app->singleton(CartPipelineRunner::class);
        $this->app->singleton(DiscountValidator::class);
        $this->app->singleton(DiscountCalculator::class);
        $this->app->singleton(CartManager::class);
        $this->app->singleton(CartSessionManager::class);
    }

    protected function registerModelBindings(): void
    {
        $this->app->bind(CartContract::class, config('cart.models.cart', Cart::class));
        $this->app->bind(CartLineContract::class, config('cart.models.cart_line', CartLine::class));
    }
}
