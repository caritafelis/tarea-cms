interface RelationOption {
    id: number;
    title: string;
}

interface Props {
    value: number | null;
    relations: RelationOption[];
    onChange: (v: number | null) => void;
}

const BASE_CLASS =
    'w-full rounded-md border border-sidebar-border/70 bg-white dark:bg-neutral-900 px-3 py-2 text-sm';

export default function RelationField({
    value,
    relations,
    onChange,
}: Props) {
    return (
        <select
            value={value ?? ''}
            onChange={(e) =>
                onChange(
                    e.target.value
                        ? Number(e.target.value)
                        : null
                )
            }
            className={BASE_CLASS}
        >
            <option value="">
                Select relation
            </option>

            {relations.map((relation) => (
                <option
                    key={relation.id}
                    value={relation.id}
                >
                    {relation.title}
                </option>
            ))}
        </select>
    );
}