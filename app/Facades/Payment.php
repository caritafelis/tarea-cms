<?php

namespace App\Facades;

use App\Contracts\Payment\PaymentDriver;
use App\Services\Payment\PaymentManager;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Facade;

/**
 * @method static PaymentDriver driver(?string $name = null)
 * @method static PaymentManager extend(string $name, \Closure $callback)
 * @method static array availableDrivers()
 * @method static Collection configuredDrivers()
 * @method static bool isConfigured(string $name)
 *
 * @see PaymentManager
 */
final class Payment extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return PaymentManager::class;
    }
}
