import { router } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import StepShell from './step-shell';
import { money } from './constants';
import type { Plan } from '@/types';

type Props = { plan: Plan; marketingUrl: string; onBack: () => void; onNext: () => void };

export default function PlanConfirmStep({ plan, marketingUrl, onBack, onNext }: Props) {
    const [loading, setLoading] = useState(false);
    const free = plan.tier === 'free';
    const contactSales = !free && plan.price_cents === 0;

    const submit = () => {
        if (contactSales) {
            window.location.href = `${marketingUrl}/contact`;
            return;
        }
        if (free) {
            setLoading(true);
            router.post('/onboarding/free', {}, { onFinish: () => setLoading(false) });
            return;
        }
        onNext();
    };

    const included = (plan.features ?? []).filter((f: any) => f.included).slice(0, 8);

    return (
        <StepShell
            index={2}
            title={free ? 'Your plan' : 'Confirm your plan'}
            description="This is the plan you selected on our website."
            onBack={onBack}
            nextLabel={contactSales ? 'Contact sales' : free ? 'Finish setup' : 'Continue to payment'}
            loading={loading}
            onSubmit={submit}
        >
            <div className="rounded-xl border p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-lg font-semibold">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {free ? 'Free for testing — upgrade before going to production.' : contactSales ? 'Custom pricing' : `${money(plan.price_cents)} / ${plan.interval === 'year' ? 'year' : 'month'}`}
                        </p>
                    </div>
                    <a href={`${marketingUrl}/pricing`} className="text-sm underline underline-offset-4">Change plan</a>
                </div>
                <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    {included.map((f: any) => (
                        <li key={f.label} className="flex items-center gap-2">
                            <Check className="size-4 text-emerald-600" /> {f.label}
                        </li>
                    ))}
                </ul>
            </div>
        </StepShell>
    );
}