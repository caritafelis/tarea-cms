<?php

namespace App\Support;

use App\Models\Address;
use App\Models\Brand;
use App\Models\Cart\Cart;
use App\Models\Cart\CartAddress;
use App\Models\Cart\CartLine;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Cpt;
use App\Models\CptEntry;
use App\Models\Currency;
use App\Models\Legal;
use App\Models\Order;
use App\Models\Page;
use App\Models\PaymentMethod;
use App\Models\Post;
use App\Models\Product;
use App\Models\Review;
use App\Models\Setting;
use App\Models\Team;
use Closure;
use Illuminate\Database\Eloquent\Builder;

/** Mismas reglas que ScopesToVisible / ScopesToOwner de REST, para GraphQL (scopes: ["apiVisible"|"apiOwned"]). */
class ApiScopes
{
    private static ?array $visible = null;

    private static ?array $owned = null;

    public function register(): void
    {
        Builder::macro('apiVisible', function () {
            return app(ApiScopes::class)->visible($this);
        });

        Builder::macro('apiOwned', function () {
            return app(ApiScopes::class)->owned($this);
        });
    }

    public function visible(Builder $query): Builder
    {
        $rule = $this->visibleRules()[$query->getModel()::class] ?? null;

        if ($rule === null) {
            return $query;
        }

        $request = request();

        if ($rule[0] !== null
            && ! $request->attributes->get('api_key_scoped')
            && $request->user()?->can($rule[0])) {
            return $query;
        }

        return $rule[1]($query);
    }

    public function owned(Builder $query): Builder
    {
        $rule = $this->ownedRules()[$query->getModel()::class] ?? null;
        $user = request()->user();

        if ($rule === null || ! $user) {
            return $query->whereRaw('1 = 0');
        }

        return $user->can($rule[0]) ? $query : $rule[1]($query, $user->getKey());
    }

    /** @return array<class-string, array{0: ?string, 1: Closure}> */
    private function visibleRules(): array
    {
        $enabled = fn (Builder $q) => $q->where('is_enabled', true);
        $published = fn (Builder $q) => $q->where('status', 'published');

        return self::$visible ??= [
            Brand::class => ['view_any_brand', $enabled],
            Category::class => ['view_any_category', $enabled],
            Collection::class => ['view_any_collection', fn (Builder $q) => $q->where(
                fn ($w) => $w->whereNull('published_at')->orWhere('published_at', '<=', now())
            )],
            CptEntry::class => ['view_any_cpt_entry', $published],
            Cpt::class => ['view_any_cpt', fn (Builder $q) => $q->active()],
            Currency::class => ['view_any_currency', $enabled],
            Legal::class => ['view_any_legal', $enabled],
            Page::class => ['view_any_page', $published],
            Post::class => ['view_any_post', $published],
            Product::class => ['view_any_product', fn (Builder $q) => $q->where('is_visible', true)
                ->where(fn ($w) => $w->whereNull('published_at')->orWhere('published_at', '<=', now()))],
            Review::class => ['view_any_review', fn (Builder $q) => $q->where('approved', true)],
            Setting::class => [null, fn (Builder $q) => $q->where('is_public', true)],
            PaymentMethod::class => ['view_any_payment_method', $enabled],
        ];
    }

    /** @return array<class-string, array{0: string, 1: Closure}> */
    private function ownedRules(): array
    {
        $viaCart = fn (Builder $q, $id) => $q->whereHas('cart', fn ($c) => $c->where('customer_id', $id));

        return self::$owned ??= [
            Cart::class => ['view_any_order', fn (Builder $q, $id) => $q->where('customer_id', $id)],
            CartLine::class => ['view_any_order', $viaCart],
            CartAddress::class => ['view_any_order', $viaCart],
            Order::class => ['view_any_order', fn (Builder $q, $id) => $q->where('customer_id', $id)],
            Address::class => ['view_any_user', fn (Builder $q, $id) => $q->where('user_id', $id)],
            Team::class => ['view_any_team', fn (Builder $q, $id) => $q->where(
                fn ($w) => $w->whereHas('members', fn ($m) => $m->whereKey($id))
                    ->orWhereHas('owner', fn ($o) => $o->whereKey($id))
            )],
        ];
    }
}