<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

final class CurrenciesTableSeeder extends Seeder
{
    public function run(): void
    {
        $path = app_path('Data/currencies.json');

        if (! File::exists($path)) {
            throw new \RuntimeException(
                "Currencies data file not found: {$path}"
            );
        }

        $data = json_decode(
            File::get($path),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        $currencies = collect($data)
            ->map(
                fn (array $currency, string $code): array => [
                    'code' => $code,
                    'name' => $currency['name'],
                    'symbol' => $currency['symbol'],
                    'format' => $currency['format'],
                    'exchange_rate' => $currency['exchange_rate'],
                    'is_enabled' => true,
                ]
            )
            ->values()
            ->all();

        Currency::query()->upsert(
            $currencies,
            ['code'],
            [
                'name',
                'symbol',
                'format',
                'exchange_rate',
                'is_enabled',
            ],
        );
    }
}