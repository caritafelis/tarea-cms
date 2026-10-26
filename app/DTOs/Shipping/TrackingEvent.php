<?php

namespace App\DTOs\Shipping;

use DateTimeInterface;

final readonly class TrackingEvent
{
    public function __construct(
        public string $status,
        public string $description,
        public DateTimeInterface $occurredAt,
        public ?string $location = null,
    ) {}

    /**
     * @return array<string, string|null>
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'description' => $this->description,
            'occurred_at' => $this->occurredAt->format('Y-m-d H:i:s'),
            'location' => $this->location,
        ];
    }
}
