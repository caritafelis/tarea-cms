<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

final class CountriesTableSeeder extends Seeder
{
    public function run(): void
    {
        $path = app_path('Data/countries.json');

        if (! File::exists($path)) {
            throw new \RuntimeException(
                "Countries data file not found: {$path}"
            );
        }

        $data = json_decode(
            File::get($path),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        $countries = collect($data)
            ->map(
                fn (array $country): array => [
                    'name' => $country['name']['common'],
                    'name_official' => $country['name']['official'],
                    'region' => $country['region'],
                    'subregion' => $country['subregion'],
                    'cca2' => $country['cca2'],
                    'cca3' => $country['cca3'],
                    'flag' => $country['flag'],
                    'latitude' => $country['latlng'][0],
                    'longitude' => $country['latlng'][1],
                    'phone_calling_code' => json_encode(
                        $country['idd'],
                        JSON_THROW_ON_ERROR
                    ),
                    'currencies' => json_encode(
                        $country['currencies'],
                        JSON_THROW_ON_ERROR
                    ),
                ]
            )
            ->values()
            ->all();

        Country::query()->upsert(
            $countries,
            ['cca2'],
            [
                'name',
                'name_official',
                'region',
                'subregion',
                'cca3',
                'flag',
                'latitude',
                'longitude',
                'phone_calling_code',
                'currencies',
            ],
        );
    }
}