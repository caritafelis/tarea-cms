<?php

namespace App\Support;

use App\DTOs\Shipping\Package;
use App\Models\Product;
use App\Models\ProductVariant;

final class ProductPackage
{
    private const TO_CM = ['mm' => 0.1, 'cm' => 1.0, 'm' => 100.0, 'in' => 2.54, 'ft' => 30.48];
    private const TO_KG = ['g' => 0.001, 'kg' => 1.0, 'lbs' => 0.453592];

    public static function for(Product|ProductVariant $item, int $quantity = 1): ?Package
    {
        $product = $item instanceof ProductVariant ? $item->product : $item;

        if (! $product->requiresShipping()) {
            return null;
        }

        $qty = max(1, $quantity);
        $value = fn (string $d): float => (float) ($item->{"{$d}_value"} ?? $product->{"{$d}_value"} ?? 0);
        $factor = fn (string $d, array $map): float => $map[($item->{"{$d}_unit"} ?? $product->{"{$d}_unit"})?->value ?? 'cm'] ?? 1.0;

        // Sin "requiere caja" solo cuenta el peso: las dimensiones no se envían al transportista.
        $box = $product->shipping_requires_box;

        return new Package(
            length: $box ? round($value('depth') * $factor('depth', self::TO_CM), 2) : 0,
            width: $box ? round($value('width') * $factor('width', self::TO_CM), 2) : 0,
            height: $box ? round($value('height') * $factor('height', self::TO_CM) * $qty, 2) : 0,
            weight: round($value('weight') * $factor('weight', self::TO_KG) * $qty, 3),
            unit: 'metric',
        );
    }
}