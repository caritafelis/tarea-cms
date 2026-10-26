<?php

namespace App\Enums\Payment;

enum TransactionType: string
{
    case Initiate = 'initiate';

    case Authorize = 'authorize';

    case Capture = 'capture';

    case Refund = 'refund';

    case Cancel = 'cancel';
}
