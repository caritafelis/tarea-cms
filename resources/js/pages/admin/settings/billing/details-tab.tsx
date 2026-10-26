import { BillingSettings } from '@/types';
import { CalendarClock } from 'lucide-react';
import { resolveCardGateway } from './billing-ui';
import { ContactDetailsCard } from './contact-details-card';
import { PaymentMethodsCard } from './payment-methods-card';

export default function DetailsTab({ data }: { data: BillingSettings }) {
    const sub = data.subscription;
    const plan = data.current_plan;
    const showNext = sub?.status === 'active' && plan;

    return (
        <div className="space-y-4">
            {showNext && (
                <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        {sub.auto_renew ? 'Your next payment is ' : 'Your plan ends '}
                        {sub.auto_renew && <span className="font-medium text-foreground">{plan.price}</span>}
                        {sub.ends_at && <> on <span className="font-medium text-foreground">{sub.ends_at}</span></>}.
                        {!sub.auto_renew && ' Auto-renewal is off, so you won’t be charged again.'}
                    </p>
                </div>
            )}
            <ContactDetailsCard data={data} />
            <PaymentMethodsCard methods={data.payment_methods} cardGateway={resolveCardGateway(data)} />
        </div>
    );
}