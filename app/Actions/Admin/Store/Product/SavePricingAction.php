<?php

namespace App\Actions\Admin\Store\Product;

use App\Models\Price;
use Illuminate\Database\Eloquent\Model;

final class SavePricingAction
{
    /**
     * @param  array<string, mixed>  $pricing
     */
    public function __invoke(array $pricing, Model $model): void
    {
        foreach ($pricing as $key => $price) {
            $amount = data_get($price, 'amount');

            if ($amount) {
                Price::query()->updateOrCreate(
                    attributes: [
                        'currency_id' => $key,
                        'priceable_id' => $model->id, // @phpstan-ignore-line
                        'priceable_type' => $model->getMorphClass(),
                    ],
                    values: array_merge($price, [
                        'priceable_id' => $model->id, // @phpstan-ignore-line
                        'priceable_type' => $model->getMorphClass(),
                    ])
                );
            }
        }
    }
}
