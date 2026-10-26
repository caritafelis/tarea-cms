<?php

use App\Http\Controllers\Admin\AttributeController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\CarrierController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CollectionController;
use App\Http\Controllers\Admin\CountryController;
use App\Http\Controllers\Admin\CurrencyController;
use App\Http\Controllers\Admin\CurrencyCorrectionController;
use App\Http\Controllers\Admin\DiscountController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\PaymentMethodController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ReviewController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\TaxZoneController;
use App\Http\Controllers\Admin\ZoneController;
use App\Http\Middleware\EnsureTeamMembership;
use App\Http\Middleware\SetCurrentTeamPermissions;
use Illuminate\Support\Facades\Route;

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class, SetCurrentTeamPermissions::class, 'onboarding'])
    ->group(function () {
        Route::middleware(['web'])
            ->name('admin.')
            ->group(function () {
                Route::middleware('module:ecommerce')->group(function () {
                    Route::middleware(['permission:view_any_product'])->prefix('products')->name('products.')->group(function () {
                        Route::get('/', [ProductController::class, 'index'])->name('index');
                        Route::get('/create', [ProductController::class, 'create'])->name('create');
                        Route::post('/', [ProductController::class, 'store'])->name('store');
                        Route::prefix('{product}')->group(function () {
                            Route::get('/', [ProductController::class, 'show'])->name('show');
                            Route::get('/edit', [ProductController::class, 'edit'])->name('edit');
                            Route::put('/', [ProductController::class, 'update'])->name('update');
                            Route::delete('/', [ProductController::class, 'destroy'])->name('destroy');
                            Route::post('duplicate', [ProductController::class, 'duplicate'])->name('duplicate');
                            // Rutas personalizadas para Variantes
                            Route::post('/variants', [ProductController::class, 'storeVariant'])->name('variants.store');
                            Route::put('/variants/{variant}', [ProductController::class, 'updateVariant'])->name('variants.update');
                            Route::delete('/variants/{variant}', [ProductController::class, 'destroyVariant'])->name('variants.destroy');
                            // Rutas personalizadas para Stock
                            Route::post('/stock', [ProductController::class, 'adjustStock'])->name('stock.adjust');
                            Route::post('/variants/{variant}/stock', [ProductController::class, 'adjustVariantStock'])->name('variants.stock.adjust');
                            Route::post('media', [ProductController::class, 'uploadMedia'])->name('media.store');
                            Route::delete('media/{media}', [ProductController::class, 'destroyMedia'])->name('media.destroy');
                        });
                    });
                     Route::middleware(['permission:view_any_brand'])
                        ->resource('brands', BrandController::class)->except(['show', 'create', 'edit']);

                    Route::middleware(['permission:view_any_order'])
                        ->resource('orders', OrderController::class)->only(['index', 'show', 'update']);

                    Route::middleware(['permission:view_any_category'])
                        ->resource('categories', CategoryController::class)->except(['show', 'create', 'edit']);

                    Route::middleware(['permission:view_any_supplier'])->prefix('suppliers')->name('suppliers.')->group(function () {
                        Route::get('/', [ SupplierController::class, 'index', ])->name('index'); 
                        Route::get('/create', [ SupplierController::class, 'create', ])->name('create'); 
                        Route::post('/', [ SupplierController::class, 'store', ])->name('store'); 
                        Route::get('/trashed', [ SupplierController::class, 'trashed', ])->name('trashed'); 
                        Route::prefix('{supplier}')->group(function () {
                            Route::get('/', [ SupplierController::class, 'show', ])->name('show'); 
                            Route::get('/edit', [ SupplierController::class, 'edit', ])->name('edit'); 
                            Route::put('/', [ SupplierController::class, 'update', ])->name('update'); 
                            Route::patch('/enable', [ SupplierController::class, 'enable', ])->name('enable'); 
                            Route::patch('/disable', [ SupplierController::class, 'disable', ])->name('disable'); 
                            Route::patch('/toggle', [ SupplierController::class, 'toggle', ])->name('toggle'); 
                            Route::delete('/', [ SupplierController::class, 'destroy', ])->name('destroy'); 
                            Route::patch('/restore', [ SupplierController::class, 'restore', ])->name('restore'); 
                            Route::delete('/force', [ SupplierController::class, 'forceDestroy', ])->name('force-destroy');
                        });
                    });

                    Route::middleware(['permission:view_any_collection'])
                        ->resource('collections', CollectionController::class)->except(['show', 'create', 'edit']);

                    Route::middleware(['permission:view_any_attribute'])
                        ->resource('attributes', AttributeController::class)->except(['show', 'create', 'edit']);

                    Route::middleware(['permission:view_any_review'])
                        ->resource('reviews', ReviewController::class)->only(['index', 'update', 'destroy']);

                    Route::middleware(['permission:view_any_zone'])
                        ->resource('zones', ZoneController::class)->except(['show', 'create', 'edit']);

                    Route::middleware(['permission:view_any_tax_zone'])
                        ->resource('tax-zones', TaxZoneController::class)->except(['show', 'create', 'edit']);

                    Route::middleware(['permission:view_any_carrier'])->group(function () {
                        Route::resource('carriers', CarrierController::class)->except(['show', 'create', 'edit']);
                        Route::post('carriers/{carrier}/options', [CarrierController::class, 'storeOption'])->name('carriers.options.store');
                        Route::put('carriers/{carrier}/options/{option}', [CarrierController::class, 'updateOption'])->name('carriers.options.update');
                        Route::delete('carriers/{carrier}/options/{option}', [CarrierController::class, 'destroyOption'])->name('carriers.options.destroy');
                    });

                    Route::middleware(['permission:view_any_payment_method'])
                        ->resource('payment-methods', PaymentMethodController::class)->except(['show', 'create', 'edit']);

                    Route::middleware(['permission:view_any_discount'])
                        ->resource('discounts', DiscountController::class)->except(['show', 'create', 'edit']);

                    Route::middleware(['permission:view_any_country'])
                        ->resource('countries', CountryController::class)->except(['show', 'create', 'edit']);

                    Route::middleware(['permission:view_any_currency'])->prefix('currencies')->name('currencies.')->group(function () {
                        Route::get('/', [CurrencyController::class, 'index'])->name('index');
                        Route::post('/', [CurrencyController::class, 'store'])->name('store');
                        Route::put('/{currency}', [CurrencyController::class, 'update'])->name('update');
                        Route::delete('/{currency}', [CurrencyController::class, 'destroy'])->name('destroy');
                        Route::post('/normalize', [CurrencyCorrectionController::class, 'store'])->name('normalize');
                    });
                });
            });
    });

