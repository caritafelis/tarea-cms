interface Option {
    label: string;
    value: string;
}

interface Props {
    value: string[];
    options: Option[];
    onChange: (v: string[]) => void;
}

export default function CheckboxField({
    value = [],
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
                        type="checkbox"
                        checked={value.includes(option.value)}
                        onChange={(e) => {
                            if (e.target.checked) {
                                onChange([
                                    ...value,
                                    option.value,
                                ]);
                            } else {
                                onChange(
                                    value.filter(
                                        v => v !== option.value
                                    )
                                );
                            }
                        }}
                    />

                    {option.label}
                </label>
            ))}
        </div>
    );
}