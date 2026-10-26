<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use Carbon\CarbonImmutable;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use App\GraphQL\TranslateIntrospection;
use Illuminate\Support\Facades\Event;
use Nuwave\Lighthouse\Events\ManipulateResult;
use Laravel\Sanctum\Sanctum;
use App\Support\ApiScopes;
use App\Models\Cart\{Cart,CartLine,CartAddress};
use App\Models\{Order,Address,Review};
use App\Policies\CartPolicy;
use App\Policies\CartLinePolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        // Admin bypass for Spatie Permission
        Gate::before(function ($user, $ability) {

            if ($this->isSuperAdmin($user)) {
                return true;
            }

            if (str_starts_with((string) $ability, 'superadmin')) {
                return null;
            }

            return $user->hasRole('Admin') ? true : null;
        });

        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
        Gate::define('manage-settings', fn ($user) => $user->can('update_setting'));
        app(ApiScopes::class)->register();
        Gate::define('platform-admin', fn () => false);

        $owned = [
            Cart::class => [fn ($m) => $m->customer_id, true, false],
            CartLine::class => [fn ($m) => $m->cart?->customer_id, true, false],
            CartAddress::class => [fn ($m) => $m->cart?->customer_id, true, false],
            Order::class => [fn ($m) => $m->customer_id, false, false],
            Address::class => [fn ($m) => $m->user_id, true, false],
            Review::class => [fn ($m) => $m->author_type === (new User)->getMorphClass() ? $m->author_id : null, true, true],
        ];

        foreach ($owned as $model => [$resolver, $ownerCanWrite, $publicRead]) {
            $id = "api.policy.owned.{$model}";
            $this->app->bind($id, fn () => new OwnedPolicy($model, $resolver, $ownerCanWrite, $publicRead));
            Gate::policy($model, $id);
        }

        // --- Policies para el resto de schemas ---
        $publicDirs = [
            'Attributes', 'AttributeValues', 'Brands', 'CarrierOptions', 'Carriers', 'Categories',
            'CollectionRules', 'Collections', 'Countries', 'CptDefinitions', 'CptEntries', 'Cpts',
            'Currencies', 'Legals', 'MediaFolders', 'MediaLibraries', 'Pages', 'PaymentMethods',
            'Posts', 'ProductVariants', 'Products', 'Reviews', 'Settings', 'TaxRates', 'TaxZones', 'Zones',
        ];

        foreach (glob(app_path('JsonApi/V1/*/*Schema.php')) as $file) {
            $dir = basename(dirname($file));
            $schema = 'App\\JsonApi\\V1\\'.$dir.'\\'.basename($file, '.php');
            $model = $schema::$model;

            if (isset($owned[$model]) || Gate::getPolicyFor($model)) {
                continue; // Team conserva TeamPolicy
            }

            $isPublic = in_array($dir, $publicDirs, true);
            $id = "api.policy.{$dir}";
            $this->app->bind($id, fn () => new ApiResourcePolicy($model, $isPublic));
            Gate::policy($model, $id);
        }

        // --- El cliente nunca decide el dueño ni cuelga datos en carritos ajenos ---
        $apiUser = fn () => (request()->is('api/v1/*') || request()->is('graphql')) ? request()->user() : null;

        $fail = function (string $message, int $status = 403): never {
            if (request()->is('graphql')) {
                throw new Error($message);
            }
            abort($status, $message);
        };

        Cart::creating(function (Cart $cart) use ($apiUser) {
            if ($user = $apiUser()) {
                $cart->customer_id = $user->getKey();
            }
        });

        Address::creating(function (Address $address) use ($apiUser) {
            if ($user = $apiUser()) {
                $address->user_id = $user->getKey();
            }
        });

        Review::creating(function (Review $review) use ($apiUser) {
            if ($user = $apiUser()) {
                $review->author_type = $user->getMorphClass();
                $review->author_id = $user->getKey();
                if (! $user->can('update_review')) {
                    $review->approved = false;
                }
            }
        });

        Review::updating(function (Review $review) use ($apiUser) {
            if (($user = $apiUser()) && ! $user->can('update_review')) {
                $review->approved = $review->getOriginal('approved');
            }
        });

        $guardCart = function (Model $model) use ($apiUser, $fail): void {
            $user = $apiUser();

            if (! $user || $user->can('update_order')) {
                return;
            }

            $cart = Cart::query()->find($model->cart_id);

            if (! $cart || (string) $cart->customer_id !== (string) $user->getKey()) {
                $fail('Cart not found or not yours.');
            }
        };

        CartAddress::saving($guardCart);
        CartLine::saving(function (CartLine $line) use ($guardCart, $apiUser) {
            $guardCart($line);
            if ($apiUser()) {
                CartPricing::apply($line);
            }
        });

        Event::listen(ManipulateResult::class, TranslateIntrospection::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );

        Queue::failing(function (JobFailed $event) {
            logger()->error('Queue job failed', [
                'job' => $event->job->resolveName(),
                'connection' => $event->connectionName,
                'queue' => $event->job->getQueue(),
                'exception' => $event->exception->getMessage(),
            ]);
        });
    }

    private function isSuperAdmin($user): bool
    {
        $attrs = request()->attributes;
        $key = 'is_superadmin_'.$user->getKey();

        if (! $attrs->has($key)) {
            $attrs->set($key, \Illuminate\Support\Facades\DB::table(config('permission.table_names.model_has_roles').' as mhr')
                ->join(config('permission.table_names.roles').' as r', 'r.id', '=', 'mhr.role_id')
                ->where('mhr.model_id', $user->getKey())
                ->where('mhr.model_type', $user->getMorphClass())
                ->where('r.name', 'SuperAdmin')
                ->exists());
        }

        return $attrs->get($key);
    }

}