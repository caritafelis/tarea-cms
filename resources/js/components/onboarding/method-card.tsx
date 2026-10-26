import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = { active: boolean; disabled?: boolean; onClick: () => void; title: string; icon: ReactNode };

export default function MethodCard({ active, disabled, onClick, title, icon }: Props) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-lg border bg-white px-5 py-4 text-left font-medium text-neutral-900 transition disabled:cursor-not-allowed disabled:opacity-50 ${active ? 'border-[#c4229f] ring-2 ring-[#c4229f]/20' : 'border-neutral-200 hover:border-neutral-300'
                }`}
        >
            {icon}
            <span className="flex-1">{title}</span>
            <span className={`grid size-5 place-items-center rounded-full border ${active ? 'border-[#c4229f] bg-[#c4229f] text-white' : 'border-neutral-300'}`}>
                {active && <Check className="size-3" strokeWidth={3.5} />}
            </span>
        </button>
    );
}