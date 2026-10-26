<?php

namespace App\Jobs;

use App\Enums\DiscountApplyTo;
use App\Enums\DiscountCondition;
use App\Models\Discount;
use App\Models\DiscountDetail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AttachedDiscountToProducts implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public DiscountApplyTo $applyTo,
        public array $productIds,
        public Discount $discount
    ) {}

    public function handle(): void
    {
        if ($this->applyTo === DiscountApplyTo::Products) {
            // Remove all the products that's not been selected that already exist during creation of the discount
            $this->discount->items()
                ->where('condition', DiscountCondition::ApplyTo)
                ->whereNotIn('discountable_id', $this->productIds)
                ->delete();

            // Create or Update the associate the discount to all the selected products.
            foreach ($this->productIds as $productId) {
                DiscountDetail::query()->updateOrCreate(
                    attributes: [
                        'discount_id' => $this->discount->id,
                        'discountable_id' => $productId,
                        'discountable_type' => config('shopper.models.product'),
                    ],
                    values: ['condition' => DiscountCondition::ApplyTo]
                );
            }
        } else {
            $this->discount->items()
                ->where('condition', DiscountCondition::ApplyTo)
                ->delete();
        }
    }
}
