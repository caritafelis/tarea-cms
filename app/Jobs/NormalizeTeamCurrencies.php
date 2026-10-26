<?php

namespace App\Jobs;

use Closure;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class NormalizeTeamCurrencies implements ShouldQueue
{
    use Queueable;

    /** @var array<string, int> */
    private array $results = [];

    public function __construct(
        protected int $teamId
    ) {}

    public function handle(): void
    {
        $currencies = DB::table(shopper_table('currencies'))
            ->whereIn('code', zero_decimal_currencies())
            ->pluck('id', 'code');

        if ($currencies->isEmpty()) {
            return;
        }

        $currencyCodes = $currencies->keys()->all();

        $orderIds = $this->teamOrderIdsForCurrencies($currencyCodes);
        $cartLineIds = $this->teamCartLineIdsForCurrencies($currencyCodes);

        $this->results['orders'] = $orderIds->isNotEmpty()
            ? $this->fixTable(
                fn (): int => DB::table(shopper_table('orders'))
                    ->whereIn('id', $orderIds)
                    ->update([
                        'price_amount' => DB::raw(
                            'ROUND(price_amount / 100.0)'
                        ),
                        'tax_amount' => DB::raw(
                            'CASE
                                WHEN tax_amount IS NOT NULL
                                THEN ROUND(tax_amount / 100.0)
                                ELSE NULL
                            END'
                        ),
                    ]),
            )
            : 0;

        $this->results['order_items'] = $orderIds->isNotEmpty()
            ? $this->fixTable(
                fn (): int => DB::table(shopper_table('order_items'))
                    ->whereIn('order_id', $orderIds)
                    ->update([
                        'unit_price_amount' => DB::raw(
                            'ROUND(unit_price_amount / 100.0)'
                        ),
                        'tax_amount' => DB::raw(
                            'ROUND(tax_amount / 100.0)'
                        ),
                        'discount_amount' => DB::raw(
                            'ROUND(discount_amount / 100.0)'
                        ),
                    ]),
            )
            : 0;

        $this->results['cart_lines'] = $cartLineIds->isNotEmpty()
            ? $this->fixTable(
                fn (): int => DB::table(shopper_table('cart_lines'))
                    ->whereIn('id', $cartLineIds)
                    ->update([
                        'unit_price_amount' => DB::raw(
                            'ROUND(unit_price_amount / 100.0)'
                        ),
                    ]),
            )
            : 0;

        $this->results['cart_line_tax_lines'] = $cartLineIds->isNotEmpty()
            ? $this->fixTable(
                fn (): int => DB::table(shopper_table('cart_line_tax_lines'))
                    ->whereIn('cart_line_id', $cartLineIds)
                    ->update([
                        'amount' => DB::raw(
                            'ROUND(amount / 100.0)'
                        ),
                    ]),
            )
            : 0;

        $this->results['cart_line_adjustments'] = $cartLineIds->isNotEmpty()
            ? $this->fixTable(
                fn (): int => DB::table(shopper_table('cart_line_adjustments'))
                    ->whereIn('cart_line_id', $cartLineIds)
                    ->update([
                        'amount' => DB::raw(
                            'ROUND(amount / 100.0)'
                        ),
                    ]),
            )
            : 0;
    }

    /**
     * @param  array<int, string>  $currencyCodes
     * @return Collection<int, int>
     */
    private function teamOrderIdsForCurrencies(
        array $currencyCodes
    ): Collection {
        $ordersTable = shopper_table('orders');

        return DB::table($ordersTable)
            ->join(
                'users',
                'users.id',
                '=',
                "{$ordersTable}.customer_id"
            )
            ->where('users.current_team_id', $this->teamId)
            ->whereIn(
                "{$ordersTable}.currency_code",
                $currencyCodes
            )
            ->pluck("{$ordersTable}.id");
    }

    /**
     * @param  array<int, string>  $currencyCodes
     * @return Collection<int, int>
     */
    private function teamCartLineIdsForCurrencies(
        array $currencyCodes
    ): Collection {
        $cartsTable = shopper_table('carts');
        $cartLinesTable = shopper_table('cart_lines');

        $cartIds = DB::table($cartsTable)
            ->join(
                'users',
                'users.id',
                '=',
                "{$cartsTable}.customer_id"
            )
            ->where('users.current_team_id', $this->teamId)
            ->whereIn(
                "{$cartsTable}.currency_code",
                $currencyCodes
            )
            ->pluck("{$cartsTable}.id");

        if ($cartIds->isEmpty()) {
            return collect();
        }

        return DB::table($cartLinesTable)
            ->whereIn('cart_id', $cartIds)
            ->pluck("{$cartLinesTable}.id");
    }

    private function fixTable(Closure $update): int
    {
        return DB::transaction(
            fn (): int => $update()
        );
    }
}
