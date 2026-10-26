<?php

namespace App\Actions\Store;

use App\Enums\ShipmentStatus;
use App\Events\Orders\OrderShipmentDelivered;
use App\Models\OrderShipping;

final class MarkShipmentDeliveredAction
{
    /**
     * @param  array{
     *     description?: string,
     *     location?: string,
     *     latitude?: float,
     *     longitude?: float,
     *     metadata?: array<string, mixed>,
     * }  $context
     */
    public function execute(OrderShipping $shipment, array $context = []): void
    {
        if (! $shipment->canBeDelivered()) {
            return;
        }

        (new RecordShipmentEventAction)->execute($shipment, ShipmentStatus::Delivered, $context);

        event(new OrderShipmentDelivered($shipment->order, $shipment));
    }
}
