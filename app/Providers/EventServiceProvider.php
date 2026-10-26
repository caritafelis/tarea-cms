<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

// Importa aquí tus eventos y listeners reales, por ejemplo:
// use App\Events\OrderPlaced;
// use App\Listeners\SendOrderConfirmation;

final class EventServiceProvider extends ServiceProvider
{
    /**
     * Mapeo de eventos a sus listeners.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // OrderPlaced::class => [
        //     SendOrderConfirmation::class,
        // ],
    ];

    /**
     * Determina si los eventos y listeners deben autodescubrirse.
     * Déjalo en false si prefieres declarar todo explícitamente arriba.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }

    public function boot(): void
    {
        parent::boot();
    }
}
