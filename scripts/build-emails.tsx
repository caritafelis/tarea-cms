import { render } from '@react-email/render';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { ReactElement } from 'react';
import OrderCancelled from '../resources/js/emails/OrderCancelled';
import OrderConfirmation from '../resources/js/emails/OrderConfirmation';
import OrderDelivered from '../resources/js/emails/OrderDelivered';
import OrderShipped from '../resources/js/emails/OrderShipped';
import PasswordChangeCode from '../resources/js/emails/PasswordChangeCode';
import PaymentFailed from '../resources/js/emails/PaymentFailed';
import PaymentReceived from '../resources/js/emails/PaymentReceived';
import PaymentRefunded from '../resources/js/emails/PaymentRefunded';
import ResetPassword from '../resources/js/emails/ResetPassword';
import SubscriptionCanceled from '../resources/js/emails/SubscriptionCanceled';
import TeamInvitation from '../resources/js/emails/TeamInvitation';
import VerifyEmail from '../resources/js/emails/verify-email';
import Welcome from '../resources/js/emails/Welcome';

const out = 'resources/views/emails';
mkdirSync(out, { recursive: true });

/** p('name','url') => { name: '{{ $name }}', url: '{{ $url }}' } */
const p = (...keys: string[]) => Object.fromEntries(keys.map((k) => [k, `{{ $${k} }}`]));

const rowHtml =
    `<table width="100%" role="presentation" style="border-bottom:1px solid #e4e4e7"><tr>` +
    `<td style="padding:8px 0;font-size:14px">{{ $item['name'] }} × {{ $item['qty'] }}</td>` +
    `<td align="right" style="padding:8px 0;font-size:14px;font-weight:600">{{ $item['total'] }}</td></tr></table>`;
const loopHtml = `@foreach($items as $item)${rowHtml}@endforeach`;
const loopText = `@foreach($items as $item)\n- {{ $item['name'] }} x{{ $item['qty'] }}  {{ $item['total'] }}\n@endforeach`;

async function build(file: string, el: ReactElement) {
    const html = (await render(el)).replace(/<p[^>]*>__ITEMS__<\/p>/, loopHtml);
    const text = (await render(el, { plainText: true })).replace('__ITEMS__', loopText);
    writeFileSync(`${out}/${file}.blade.php`, html);
    writeFileSync(`${out}/${file}-text.blade.php`, text);
}

await build('verify-email', <VerifyEmail {...p('name', 'code', 'url', 'appName')} />);
await build('reset-password', <ResetPassword {...p('name', 'url', 'minutes', 'appName')} />);
await build('password-change-code', <PasswordChangeCode {...p('name', 'code', 'minutes', 'appName')} />);
await build('team-invitation', <TeamInvitation {...p('inviter', 'teamName', 'url', 'appName')} />);
await build('welcome', <Welcome {...p('name', 'plan', 'url', 'appName')} />);
await build('payment-received', <PaymentReceived {...p('name', 'plan', 'amount', 'date', 'transactionId', 'authCode', 'nextBilling', 'url', 'appName')} />);
await build('payment-failed', <PaymentFailed {...p('name', 'plan', 'amount', 'retryDate', 'url', 'appName')} />);
await build('subscription-canceled', <SubscriptionCanceled {...p('name', 'plan', 'endsAt', 'url', 'appName')} />);
await build('payment-refunded', <PaymentRefunded {...p('name', 'amount', 'transactionId', 'appName')} />);
await build('order-confirmation', <OrderConfirmation {...p('name', 'orderNumber', 'subtotal', 'shipping', 'tax', 'total', 'address', 'url', 'appName')} />);
await build('order-shipped', <OrderShipped {...p('name', 'orderNumber', 'carrier', 'tracking', 'url', 'appName')} />);
await build('order-delivered', <OrderDelivered {...p('name', 'orderNumber', 'url', 'appName')} />);
await build('order-cancelled', <OrderCancelled {...p('name', 'orderNumber', 'total', 'appName')} />);

console.log('Email templates compiled to', out);