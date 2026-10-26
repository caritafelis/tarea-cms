import { HiOutlineCheck } from 'react-icons/hi';
import type { Option } from '@/types';

type Props = {
    options: Option[];
    value: string;
    onChange: (v: string) => void;
    layout?: 'auto' | 'column';
};

export default function OptionGrid({
    options,
    value,
    onChange,
    layout = 'auto',
}: Props) {
    const singleColumn = layout === 'column';

    return (
        <div
            role="radiogroup"
            className={`grid min-w-0 gap-2 ${singleColumn
                ? 'grid-cols-1'
                : 'grid-cols-1 sm:grid-cols-2'
                } `}
        >
            {options.map((o) => {
                const active = value === o.value;

                return (
                    <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(o.value)}
                        className={`flex min-w-0 w-full items-center justify-between gap-3 rounded-full border bg-white px-3 py-2 text-left text-[15px] font-medium text-neutral-900 transition ${active
                            ? 'border-[#c4229f] ring-2 ring-[#c4229f]/20'
                            : 'border-neutral-200 hover:border-neutral-300'
                            } `}
                    >
                        <span className="min-w-0 flex-1 whitespace-normal break-words">
                            {o.label}
                        </span>

                        <span
                            className={`grid size-5 shrink-0 place-items-center rounded-full border ${active
                                ? 'border-[#c4229f] bg-[#c4229f] text-white'
                                : 'border-neutral-300'
                                } `}
                        >
                            {active && (
                                <HiOutlineCheck
                                    className="size-3"
                                    strokeWidth={3.5}
                                />
                            )}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}