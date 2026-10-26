<?php

namespace App\JsonApi\V1;

use App\JsonApi\V1\Addresses\AddressSchema;
use App\JsonApi\V1\Attributes\AttributeSchema;
use App\JsonApi\V1\AttributeValues\AttributeValueSchema;
use App\JsonApi\V1\Brands\BrandSchema;
use App\JsonApi\V1\CarrierOptions\CarrierOptionSchema;
use App\JsonApi\V1\Carriers\CarrierSchema;
use App\JsonApi\V1\CartAddresses\CartAddressSchema;
use App\JsonApi\V1\CartLineAdjustments\CartLineAdjustmentSchema;
use App\JsonApi\V1\CartLines\CartLineSchema;
use App\JsonApi\V1\CartLineTaxLines\CartLineTaxLineSchema;
use App\JsonApi\V1\Carts\CartSchema;
use App\JsonApi\V1\Categories\CategorySchema;
use App\JsonApi\V1\CollectionRules\CollectionRuleSchema;
use App\JsonApi\V1\Collections\CollectionSchema;
use App\JsonApi\V1\Countries\CountrySchema;
use App\JsonApi\V1\CptDefinitions\CptDefinitionSchema;
use App\JsonApi\V1\CptEntries\CptEntrySchema;
use App\JsonApi\V1\Cpts\CptSchema;
use App\JsonApi\V1\Currencies\CurrencySchema;
use App\JsonApi\V1\Discounts\DiscountSchema;
use App\JsonApi\V1\Inventories\InventorySchema;
use App\JsonApi\V1\Legals\LegalSchema;
use App\JsonApi\V1\MediaFolders\MediaFolderSchema;
use App\JsonApi\V1\MediaLibraries\MediaLibrarySchema;
use App\JsonApi\V1\OrderAddresses\OrderAddressSchema;
use App\JsonApi\V1\OrderItems\OrderItemSchema;
use App\JsonApi\V1\Orders\OrderSchema;
use App\JsonApi\V1\OrderShippingEvents\OrderShippingEventSchema;
use App\JsonApi\V1\OrderShippings\OrderShippingSchema;
use App\JsonApi\V1\OrderTaxLines\OrderTaxLineSchema;
use App\JsonApi\V1\Pages\PageSchema;
use App\JsonApi\V1\PaymentMethods\PaymentMethodSchema;
use App\JsonApi\V1\PaymentTransactions\PaymentTransactionSchema;
use App\JsonApi\V1\Posts\PostSchema;
use App\JsonApi\V1\Products\ProductSchema;
use App\JsonApi\V1\ProductVariants\ProductVariantSchema;
use App\JsonApi\V1\Reviews\ReviewSchema;
use App\JsonApi\V1\Settings\SettingSchema;
use App\JsonApi\V1\Suppliers\SupplierSchema;
use App\JsonApi\V1\TaxRates\TaxRateSchema;
use App\JsonApi\V1\TaxZones\TaxZoneSchema;
use App\JsonApi\V1\Users\UserSchema;
use App\JsonApi\V1\Zones\ZoneSchema;
use LaravelJsonApi\Core\Server\Server as BaseServer;

class Server extends BaseServer
{
    /**
     * The internal cache for this server's base URI.
     *
     * @var string|null
     */
    protected string $baseUri = '';

    /**
     * Calculate the base URI programmatically based on the route (tenant/team)
     * or the authenticated user's current team (Fortify/Jetstream).
     */
    protected function baseUri(): string
    {
        return '/api/v1';
    }

    /**
     * Bootstrap the server when it is handling an HTTP request.
     */
    public function serving(): void
    {
        // Register events or global configurations for this server
    }

    /**
     * Get the server's list of schemas.
     */
    protected function allSchemas(): array
    {
        return [
            AddressSchema::class,
            AttributeSchema::class,
            AttributeValueSchema::class,
            BrandSchema::class,
            CarrierOptionSchema::class,
            CarrierSchema::class,
            CartAddressSchema::class,
            CartLineAdjustmentSchema::class,
            CartLineSchema::class,
            CartLineTaxLineSchema::class,
            CartSchema::class,
            CategorySchema::class,
            CollectionRuleSchema::class,
            CollectionSchema::class,
            CountrySchema::class,
            CptDefinitionSchema::class,
            CptEntrySchema::class,
            CptSchema::class,
            CurrencySchema::class,
            DiscountSchema::class,
            InventorySchema::class,
            LegalSchema::class,
            MediaFolderSchema::class,
            MediaLibrarySchema::class,
            OrderAddressSchema::class,
            OrderItemSchema::class,
            OrderSchema::class,
            OrderShippingEventSchema::class,
            OrderShippingSchema::class,
            OrderTaxLineSchema::class,
            PageSchema::class,
            PaymentMethodSchema::class,
            PaymentTransactionSchema::class,
            PostSchema::class,
            ProductSchema::class,
            ProductVariantSchema::class,
            ReviewSchema::class,
            SettingSchema::class,
            SupplierSchema::class,
            TaxRateSchema::class,
            TaxZoneSchema::class,
            UserSchema::class,
            ZoneSchema::class,
        ];
    }
}
