<?php

namespace App\Services\Payment\Drivers;

use App\Contracts\Payment\PaymentDriver;
use App\DTOs\Payment\PaymentResult;
use App\DTOs\Payment\WebhookResult;
use App\Exceptions\PaymentException;

abstract class Driver implements PaymentDriver
{
    public function logo(): ?string
    {
        return null;
    }

    public function supportsWebhooks(): bool
    {
        return true;
    }

    public function supportsRefunds(): bool
    {
        return true;
    }

    public function authorizePayment(string $reference, array $data = []): PaymentResult
    {
        throw PaymentException::notSupported('authorizePayment', $this->code());
    }

    public function capturePayment(string $reference, ?int $amount = null): PaymentResult
    {
        throw PaymentException::notSupported('capturePayment', $this->code());
    }

    public function refundPayment(string $reference, int $amount, ?string $reason = null): PaymentResult
    {
        throw PaymentException::notSupported('refundPayment', $this->code());
    }

    public function cancelPayment(string $reference): PaymentResult
    {
        throw PaymentException::notSupported('cancelPayment', $this->code());
    }

    public function retrievePayment(string $reference): PaymentResult
    {
        throw PaymentException::notSupported('retrievePayment', $this->code());
    }

    public function handleWebhook(array $payload, array $headers = []): WebhookResult
    {
        throw PaymentException::notSupported('handleWebhook', $this->code());
    }
}
