<?php

namespace App\Enums\Payment;

enum TransactionStatus: string
{
    case Pending = 'pending';

    case Success = 'success';

    case Failed = 'failed';
}
