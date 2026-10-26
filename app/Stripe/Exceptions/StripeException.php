<?php

namespace App\Stripe\Exceptions;

use App\Exceptions\PaymentException;
use Stripe\Exception\ApiErrorException;

final class StripeException extends PaymentException
{
    public static function fromApiError(ApiErrorException $e): self
    {
        return new self(
            message: "Stripe API error: {$e->getMessage()}",
            code: (int) $e->getCode(),
            previous: $e,
        );
    }

    public static function invalidWebhookPayload(string $message): self
    {
        return new self("Invalid Stripe webhook payload: {$message}");
    }
}
