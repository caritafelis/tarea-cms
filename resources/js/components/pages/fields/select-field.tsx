interface Option {
    label: string;
    value: string;
}

interface Props {
    value: string;
    options: Option[];
    onChange: (v: string) => void;
}

const BASE_CLASS =
    'w-full rounded-md border border-sidebar-border/70 bg-white dark:bg-neutral-900 px-3 py-2 text-sm';

export default function SelectField({
    value,
    options,
    onChange,
}: Props) {
    return (
        <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={BASE_CLASS}
        >
            <option value="">
                Select option
            </option>

            {options.map((option) => (
                <option
                    key={option.value}
                    value={option.value}
                >
                    {option.label}
                </option>
            ))}
        </select>
    );
}