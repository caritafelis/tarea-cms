const BASE_CLASS =
    'w-full rounded-md border border-sidebar-border/70 bg-white dark:bg-neutral-900 px-3 py-2 text-sm';

interface Props {
    value: string;
    onChange: (v: string) => void;
}

export default function TextareaField({
    value,
    onChange,
}: Props) {
    return (
        <textarea
            rows={5}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={BASE_CLASS}
        />
    );
}