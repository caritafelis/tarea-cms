{{ $appName }}


THANK YOU FOR YOUR ORDER!

Hi {{ $name }}, order #{{ $orderNumber }} is confirmed.

@foreach($items as $item)
- {{ $item['name'] }} x{{ $item['qty'] }}  {{ $item['total'] }}
@endforeach

----------------------------------------

Subtotal{{ $subtotal }}

Shipping{{ $shipping }}

Tax{{ $tax }}

Total{{ $total }}

Shipping to: {{ $address }}

View order {{ $url }}

----------------------------------------

Questions about your order? Just reply to this email.