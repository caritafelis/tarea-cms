<?php

namespace App\Mail;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PaymentConfirmed extends Mailable
{
    public function __construct(
        public User $user,
        public Plan $plan,
        public string $transactionId,
        public ?string $authorizationCode,
        public int $amountCents,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Payment confirmation – '.$this->plan->name);
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.payment-confirmed');
    }
}