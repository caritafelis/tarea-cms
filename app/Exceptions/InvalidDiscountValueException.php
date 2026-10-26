<?php

namespace App\Exceptions;

use Exception;

final class InvalidDiscountValueException extends Exception
{
    public static function notPositive(int $value): self
    {
        return new self("Discount value must be greater than zero, [{$value}] given.");
    }

    public static function percentageOutOfRange(int $value): self
    {
        return new self("Percentage discount value cannot exceed 100, [{$value}] given.");
    }
}
