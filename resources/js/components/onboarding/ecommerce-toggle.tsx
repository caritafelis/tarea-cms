
import { Lock, Store } from 'lucide-react';

type Props = {
    checked: boolean;
    locked?: boolean;
    onChange: (v: boolean) => void;
};

export default function EcommerceToggle({
    checked,
    locked = false,
    onChange,
}: Props) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-disabled={locked}
            disabled={locked}
            onClick={() => !locked && onChange(!checked)}
            className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${locked
                ? 'cursor-not-allowed border-neutral-200 bg-neutral-50/70'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
        >
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-neutral-100">
                <Store
                    className="size-[18px] text-neutral-600"
                    strokeWidth={1.6}
                />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-neutral-900">
                    Include online store
                </span>

                <span className="mt-0.5 block text-xs leading-5 text-neutral-500">
                    Products, orders, discounts, shipping and taxes.
                </span>

                {locked && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                        <Lock className="size-3 shrink-0" />
                        Included with your e-commerce project.
                    </span>
                )}
            </span>

            <span
                className={`relative h-[22px] w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#c4229f]' : 'bg-neutral-300'
                    } ${locked ? 'opacity-60' : ''}`}
            >
                <span
                    className={`absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[17px]' : 'translate-x-[3px]'
                        }`}
                />
            </span>
        </button>
    );
}