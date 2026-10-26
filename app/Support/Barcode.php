<?php

namespace App\Support;

final class Barcode
{
    public static function checkDigit(string $digits): int
    {
        $len = strlen($digits);
        $sum = 0;

        foreach (str_split($digits) as $i => $d) {
            $sum += (int) $d * ((($len - $i) % 2 === 1) ? 3 : 1);
        }

        return (10 - $sum % 10) % 10;
    }

    public static function valid(string $code): bool
    {
        return (bool) preg_match('/^(\d{8}|\d{12,14})$/', $code)
            && self::checkDigit(substr($code, 0, -1)) === (int) substr($code, -1);
    }

    private static function internal(string $prefix, int $id): string
    {
        $digits = $prefix.str_pad((string) $id, 12 - strlen($prefix), '0', STR_PAD_LEFT);

        return $digits.self::checkDigit($digits);
    }

    public static function forProduct(int $id): string
    {
        return self::internal('20', $id);
    }

    public static function forVariant(int $id): string
    {
        return self::internal('21', $id);
    }
}