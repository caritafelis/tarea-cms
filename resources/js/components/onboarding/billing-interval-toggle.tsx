import { BillingInterval } from "@/types";

type Props = {
    value: BillingInterval;
    onChange: (v: BillingInterval) => void;
    bestSaving?: number;
};

const OPTIONS: { value: BillingInterval; label: string }[] = [
    { value: 'month', label: 'Monthly' },
    { value: 'year', label: 'Yearly' },
];

export default function BillingIntervalToggle({ value, onChange, bestSaving = 0 }: Props) {
    return (
        <div
            role="radiogroup"
            aria-label="Billing interval"
            className="inline-flex shrink-0 items-center rounded-full bg-neutral-200/70 p-1"
        >
            {OPTIONS.map((o) => {
                const active = value === o.value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(o.value)}
                        className={`flex h-8 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition ${active ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                    >
                        {o.label}
                        {o.value === 'year' && bestSaving > 0 && (
                            <span className="rounded-full bg-[#c4229f]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#c4229f]">
                                -{bestSaving}%
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}