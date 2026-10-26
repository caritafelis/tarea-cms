const BASE_CLASS =
    'w-full rounded-md border border-sidebar-border/70 bg-white dark:bg-neutral-900 px-3 py-2 text-sm';

interface Props {
    value: string;
    onChange: (v: string) => void;
}

export default function ColorField({
    value,
    onChange,
}: Props) {
    return (
        <div className="flex gap-3 items-center">
            <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
            />

            <input
                type="text"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className={BASE_CLASS}
            />
        </div>
    );
}