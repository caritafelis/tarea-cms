<?php

use App\Models\Currency;
use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Number;

if (! function_exists('shopper_table')) {
    /**
     * Resolve a database table name. Kept as a thin passthrough (no prefixing)
     * now that models live directly in the app instead of a configurable
     * package, but centralised here since dozens of models/queries call it.
     */
    function shopper_table(string $table): string
    {
        return $table;
    }
}

if (! function_exists('shopper_panel_assets')) {
    /**
     * Resolve a public URL for an admin-panel static asset.
     */
    function shopper_panel_assets(string $path): string
    {
        return asset('admin/'.ltrim($path, '/'));
    }
}

if (! function_exists('generate_number')) {
    function generate_number(): string
    {
        /** @var ?Order $lastOrder */
        $lastOrder = Order::query()->orderBy('id', 'desc')
            ->limit(1)
            ->first();

        $generator = config('orders.generator');

        $last = $lastOrder ? $lastOrder->id : 0;
        $next = $generator['start_sequence_from'] + $last;

        $separator = $generator['separator'];
        $sequence = mb_str_pad((string) $next, $generator['pad_length'], $generator['pad_string'], \STR_PAD_LEFT);

        $parts = [];

        if ($generator['prefix']) {
            $parts[] = $generator['prefix'];
        }

        if ($generator['date_format']) {
            $parts[] = date($generator['date_format']);
        }

        $parts[] = $sequence;

        return implode($separator, $parts);
    }
}

if (! function_exists('shopper_setting')) {
    function shopper_setting(string $key, bool $withCache = true): mixed
    {
        return Cache::remember(
            "shopper-setting.{$key}",
            $withCache ? 3600 * 24 : 1,
            fn () => Setting::query()->where('key', $key)->first()?->value,
        );
    }
}

if (! function_exists('shopper_currency')) {
    function shopper_currency(): string
    {
        $currencyId = shopper_setting('default_currency_id');

        if (! $currencyId) {
            return 'USD';
        }

        return Cache::remember(
            'shopper-setting.default_currency',
            now()->addHour(),
            fn (): string => Currency::query()
                ->where('id', $currencyId)
                ->value('code') ?? 'USD',
        );
    }
}

if (! function_exists('shopper_money_format')) {
    function shopper_money_format(int $amount, ?string $currency = null): string
    {
        $currency = $currency ?? shopper_currency();

        return (string) Number::currency(
            number: is_no_division_currency($currency) ? $amount : $amount / 100,
            in: $currency,
            locale: app()->getLocale()
        );
    }
}

if (! function_exists('useTryCatch')) {
    /**
     * @return array<array-key, mixed>
     */
    function useTryCatch(Closure $closure, ?Closure $catchable = null): array
    {
        $result = null;
        $throwable = null;

        $catch = $catchable ?? fn (Throwable $exception): Throwable => $exception;

        try {
            $result = $closure();
        } catch (Throwable $exception) {
            $throwable = $catch($exception);
        }

        return [$throwable, $result];
    }
}

if (! function_exists('zero_decimal_currencies')) {
    /**
     * @return array<int, string>
     */
    function zero_decimal_currencies(): array
    {
        return [
            'BIF', 'CLP', 'DJF', 'GNF', 'HTG', 'JPY', 'KMF', 'KRW',
            'MGA', 'PYG', 'RWF', 'VND', 'VUV', 'XAF', 'XAG', 'XAU',
            'XDR', 'XOF', 'XPF',
        ];
    }
}

if (! function_exists('is_no_division_currency')) {
    function is_no_division_currency(string $currency): bool
    {
        return in_array($currency, zero_decimal_currencies());
    }
}
