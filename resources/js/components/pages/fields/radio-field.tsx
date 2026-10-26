interface Option {
    label: string;
    value: string;
}

interface Props {
    name: string;
    value: string;
    options: Option[];
    onChange: (v: string) => void;
}

export default function RadioField({
    name,
    value,
    options,
    onChange,
}: Props) {
    return (
        <div className="flex flex-wrap gap-4">
            {options.map((option) => (
                <label
                    key={option.value}
                    className="flex items-center gap-2"
                >
                    <input
                        type="radio"
                        name={name}
                        checked={value === option.value}
                        onChange={() => onChange(option.value)}
                    />

                    {option.label}
                </label>
            ))}
        </div>
    );
}