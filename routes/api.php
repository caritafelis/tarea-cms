<?php

use App\Http\Controllers\Api\OpenApiController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Webhooks\NuveiWebhookController;
use App\Http\Controllers\Api\TokenController;
use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\AttributeController;
use App\Http\Controllers\Api\V1\AttributeValueController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BrandController;
use App\Http\Controllers\Api\V1\CarrierController;
use App\Http\Controllers\Api\V1\CarrierOptionController;
use App\Http\Controllers\Api\V1\CartAddressController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CartShippingController;
use App\Http\Controllers\Api\V1\CartLineAdjustmentController;
use App\Http\Controllers\Api\V1\CartLineController;
use App\Http\Controllers\Api\V1\CartLineTaxLineController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CollectionController;
use App\Http\Controllers\Api\V1\CollectionRuleController;
use App\Http\Controllers\Api\V1\CountryController;
use App\Http\Controllers\Api\V1\CptController;
use App\Http\Controllers\Api\V1\CptDefinitionController;
use App\Http\Controllers\Api\V1\CptEntryController;
use App\Http\Controllers\Api\V1\CurrencyController;
use App\Http\Controllers\Api\V1\DiscountController;
use App\Http\Controllers\Api\V1\FieldGroupSchemaController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\LegalController;
use App\Http\Controllers\Api\V1\MediaFolderController;
use App\Http\Controllers\Api\V1\MediaLibraryController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\OrderItemController;
use App\Http\Controllers\Api\V1\PageController;
use App\Http\Controllers\Api\V1\PaymentMethodController;
use App\Http\Controllers\Api\V1\PaymentTransactionController;
use App\Http\Controllers\Api\V1\PostController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProductVariantController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\TaxRateController;
use App\Http\Controllers\Api\V1\TaxZoneController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\SocialAuthController;
use App\Http\Controllers\Api\V1\ZoneController;
use App\Http\Controllers\Api\GraphqlDocsController;
use App\Http\Middleware\ApiKeyScope;
use App\Http\Middleware\SetApiLocale;
use App\Http\Middleware\SetApiTeam;
use App\Http\Middleware\EnforcePlanApiLimits;
use Illuminate\Support\Facades\Route;
use LaravelJsonApi\Laravel\Facades\JsonApiRoute;
use LaravelJsonApi\Laravel\Routing\ActionRegistrar;
use LaravelJsonApi\Laravel\Routing\ResourceRegistrar;

Route::get('openapi.json', [OpenApiController::class, 'show']);

// -----------------------------------------------------------------------
// Callback servidor-a-servidor de Stripe. Tiene que quedar FUERA del grupo
// autenticado: Stripe no puede enviar un token Sanctum, se autentica con
// la firma (Stripe-Signature) que valida el controlador.
// -----------------------------------------------------------------------
Route::post('payments/webhook', [PaymentWebhookController::class, 'handle']);
Route::post('webhooks/nuvei', NuveiWebhookController::class);

Route::get('graphql-docs.json', [GraphqlDocsController::class, 'json']);
Route::get('graphql-docs', [GraphqlDocsController::class, 'ui']);

// -----------------------------------------------------------------------
// JSON:API v1 — TODO va aquí: un solo grupo, un solo servidor, token
// obligatorio. https://laraveljsonapi.io/5.x/routing/controllers.html
// Idioma: header X-Locale o Accept-Language (SetApiLocale).
// -----------------------------------------------------------------------

Route::prefix('tokens')
    ->middleware(['auth:sanctum', 'throttle:10,1'])
    ->group(function () {
        Route::post('/', [TokenController::class, 'store']);
        Route::delete('{tokenId}', [TokenController::class, 'destroy']);
    });

$authRoutes = function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:20,1');
    Route::post('two-factor-challenge', [AuthController::class, 'twoFactorChallenge'])->middleware('throttle:20,1');
    Route::post('register', [AccountController::class, 'register'])->middleware('throttle:10,1');
    Route::post('forgot-password', [AccountController::class, 'forgotPassword'])->middleware('throttle:10,1');
    Route::post('verify-reset-code', [AccountController::class, 'verifyResetCode'])->middleware('throttle:20,1');
    Route::post('reset-password', [AccountController::class, 'resetPassword'])->middleware('throttle:10,1');
    Route::post('social/{provider}', SocialAuthController::class)->middleware('throttle:20,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('switch-team', [AuthController::class, 'switchTeam']);
    });
};

Route::prefix('auth')->group($authRoutes);      // contrato actual de la app: /api/auth/*
Route::prefix('v1/auth')->group($authRoutes);   // alias dentro de v1: /api/v1/auth/*

Route::prefix('v1')
    ->middleware(['api'])
    ->group(function () {
        Route::get('/health', function () {return response()->json(['status' => 'ok',]);});
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/user', function (\Illuminate\Http\Request $request) {return $request->user();});
        });

    });

Route::middleware([
    'auth:sanctum',
    'throttle:120,1',
    ApiKeyScope::class,
    SetApiTeam::class,
    EnforcePlanApiLimits::class,
    SetApiLocale::class,
])->group(function () {
    Route::get('v1/carts/{cart}/shipping-options', [CartShippingController::class, 'index']);
    Route::put('v1/carts/{cart}/shipping-option', [CartShippingController::class, 'update']);
    Route::get('v1/schema', FieldGroupSchemaController::class);
    Route::get('v1/webhooks/docs', fn () => response()->json(\App\Support\WebhookDocs::catalog()));

    
JsonApiRoute::server('v1')
    ->prefix('v1')
    ->resources(function (ResourceRegistrar $server) {
        $readOnlyResources = [];

        $resources = [
            'categories' => CategoryController::class,
            'products' => ProductController::class,
            'product-variants' => ProductVariantController::class,
            'inventories' => InventoryController::class,
            'posts' => PostController::class,
            'pages' => PageController::class,
            'brands' => BrandController::class,
            'suppliers' => SupplierController::class,
            'collections' => CollectionController::class,
            'collection-rules' => CollectionRuleController::class,
            'attributes' => AttributeController::class,
            'attribute-values' => AttributeValueController::class,
            'zones' => ZoneController::class,
            'tax-zones' => TaxZoneController::class,
            'tax-rates' => TaxRateController::class,
            'carriers' => CarrierController::class,
            'carrier-options' => CarrierOptionController::class,
            'payment-methods' => PaymentMethodController::class,
            'discounts' => DiscountController::class,
            'countries' => CountryController::class,
            'currencies' => CurrencyController::class,
            'legals' => LegalController::class,
            'settings' => SettingController::class,
            'users' => UserController::class,
            'orders' => OrderController::class,
            'order-items' => OrderItemController::class,
            'cart-line-adjustments' => CartLineAdjustmentController::class,
            'cart-line-tax-lines' => CartLineTaxLineController::class,
            'payment-transactions' => PaymentTransactionController::class,
            'media-folders' => MediaFolderController::class,
            'media-libraries' => MediaLibraryController::class,
            'cpts' => CptController::class,
            'cpt-definitions' => CptDefinitionController::class,
            'cpt-entries' => CptEntryController::class,
        ];

        foreach ($resources as $uri => $controller) {
            $resource = $server->resource($uri, $controller);

            if (in_array($uri, $readOnlyResources, true)) {
                $resource->readOnly();
            }
        }

        // Storefront: recursos con operaciones de escritura.
        $server->resource('reviews', ReviewController::class);
        $server->resource('addresses', AddressController::class);
        $server->resource('cart-lines', CartLineController::class);
        $server->resource('cart-addresses', CartAddressController::class);

        $server->resource('carts', CartController::class)
            ->actions('-actions', function (ActionRegistrar $actions) {
                $actions->withId()->post('checkout');
            });
    });

});