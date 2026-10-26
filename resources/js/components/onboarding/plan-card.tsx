import { Check } from 'lucide-react';
import { PINK_TEXT, SALES_EMAIL, money } from './constants';
import type { Plan } from '@/types';

type Props = {
    plan: Plan;
    active: boolean;
    savings?: number;
    onSelect: () => void;
};

export default function PlanCard({ plan, active, savings = 0, onSelect }: Props) {
    const sales = plan.price_cents === 0;
    const yearly = plan.interval === 'year';

    return (
        <button
            type="button"
            role="radio"
            aria-checked={active}
            disabled={sales}
            onClick={onSelect}
            className={`flex h-full w-full flex-col overflow-hidden rounded-xl border bg-white p-5 text-left transition disabled:cursor-default ${active ? 'border-[#c4229f] ring-2 ring-[#c4229f]/20' : 'border-neutral-200 hover:border-neutral-300'
                }`}
        >
            <span className="flex min-h-7 shrink-0 items-center justify-between gap-2">
                <span className="font-semibold text-neutral-900">{plan.name}</span>

                {active && (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#c4229f] text-white">
                        <Check className="size-3" strokeWidth={3.5} />
                    </span>
                )}
            </span>

            <span className="mt-3 flex min-h-9 shrink-0 items-baseline text-3xl font-bold tracking-tight text-neutral-900">
                {sales ? 'Custom' : money(plan.price_cents)}

                {!sales && (
                    <span className="ml-1 text-sm font-normal text-neutral-500">
                        {yearly ? '/yr' : '/mo'} + VAT
                    </span>
                )}
            </span>

            {sales ? (
                <a
                    href={`mailto:${SALES_EMAIL}`}
                    onClick={(event) => event.stopPropagation()}
                    className={`mt-1 w-fit shrink-0 text-sm font-medium underline ${PINK_TEXT}`}
                >
                    Contact sales
                </a>
            ) : (
                <p className={`mt-1 h-5 shrink-0 text-sm font-medium ${PINK_TEXT}`}>
                    {yearly && savings > 0 ? `Save ${savings}% vs monthly` : ''}
                </p>
            )}

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                <ul className="space-y-2 pr-1 text-sm text-neutral-700">
                    {plan.features.map((f) => (
                        <li key={f.label} className="flex items-start gap-2">
                            <Check
                                className={`mt-0.5 size-4 shrink-0 ${f.included ? PINK_TEXT : 'text-neutral-300'}`}
                                strokeWidth={2.5}
                            />
                            <span className={f.included ? '' : 'text-neutral-400'}>{f.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </button>
    );
}