<?php

namespace App\Services\Payment;

use App\Contracts\Payment\PaymentDriver;
use App\Services\Payment\Drivers\ManualDriver;
use Closure;
use Illuminate\Support\Collection;
use InvalidArgumentException;

final class PaymentManager
{
    /** @var array<string, PaymentDriver> */
    private array $drivers = [];

    /** @var array<string, Closure> */
    private array $customCreators = [];

    public function driver(?string $name = null): PaymentDriver
    {
        $name ??= 'manual';

        return $this->drivers[$name] ??= $this->resolve($name);
    }

    /**
     * Register a custom driver creator.
     */
    public function extend(string $name, Closure $callback): self
    {
        $this->customCreators[$name] = $callback;

        return $this;
    }

    /**
     * Get all available driver codes.
     *
     * @return array<int, string>
     */
    public function availableDrivers(): array
    {
        $builtIn = ['manual'];
        $custom = array_keys($this->customCreators);

        return array_unique([...$builtIn, ...$custom]);
    }

    /**
     * Get all configured and enabled drivers.
     *
     * @return Collection<string, PaymentDriver>
     */
    public function configuredDrivers(): Collection
    {
        return collect($this->availableDrivers())
            ->filter(function (string $name): bool {
                if ($name === 'manual') {
                    return true;
                }

                return config("payment.drivers.{$name}.enabled", false);
            })
            ->mapWithKeys(fn (string $name): array => [$name => $this->driver($name)]);
    }

    /**
     * Check if a driver is configured and ready to use.
     */
    public function isConfigured(string $name): bool
    {
        try {
            return $this->driver($name)->isConfigured();
        } catch (InvalidArgumentException) {
            return false;
        }
    }

    private function resolve(string $name): PaymentDriver
    {
        if (isset($this->customCreators[$name])) {
            return call_user_func($this->customCreators[$name], $name);
        }

        return match ($name) {
            'manual' => new ManualDriver,
            default => throw new InvalidArgumentException("Driver [{$name}] is not supported."),
        };
    }
}
