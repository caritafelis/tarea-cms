import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type FieldOption = { value: string | number; label: string };

export type CrudField = {
    name: string;
    label: string;
    type?: 'text' | 'textarea' | 'number' | 'url' | 'email' | 'switch' | 'select' | 'datetime-local';
    options?: FieldOption[];
    placeholder?: string;
    hint?: string;
    span?: 1 | 2;
    rows?: number;
    step?: string;
    required?: boolean;
    allowEmpty?: boolean;
};

const NONE = '__none__';

type Props = {
    field: CrudField;
    value: any;
    error?: string;
    onChange: (value: any) => void;
};

export function FormField({ field, value, error, onChange }: Props) {
    const id = `field-${field.name}`;
    const type = field.type ?? 'text';

    return (
        <div className={cn('space-y-1.5', field.span === 2 && 'sm:col-span-2')}>
            {type === 'switch' ? (
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div>
                        <Label htmlFor={id}>{field.label}</Label>
                        {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                    </div>
                    <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />
                </div>
            ) : (
                <>
                    <Label htmlFor={id}>
                        {field.label}
                        {field.required && <span className="text-destructive"> *</span>}
                    </Label>

                    {type === 'textarea' ? (
                        <Textarea
                            id={id}
                            rows={field.rows ?? 3}
                            value={value ?? ''}
                            placeholder={field.placeholder}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    ) : type === 'select' ? (
                        <Select
                            value={field.allowEmpty ? (value === '' || value == null ? NONE : String(value)) : String(value ?? '')}
                            onValueChange={(v) => onChange(v === NONE ? '' : v)}
                        >
                            <SelectTrigger id={id} className="w-full">
                                <SelectValue placeholder={field.placeholder ?? 'Select…'} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.allowEmpty && <SelectItem value={NONE}>None</SelectItem>}
                                {field.options?.map((o) => (
                                    <SelectItem key={o.value} value={String(o.value)}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            id={id}
                            type={type}
                            step={field.step}
                            value={value ?? ''}
                            placeholder={field.placeholder}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    )}

                    {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                </>
            )}
            <InputError message={error} />
        </div>
    );
}