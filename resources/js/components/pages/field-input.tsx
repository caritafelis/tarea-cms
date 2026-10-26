import { FieldInputProps } from './fields';

import {
    TextField,
    TextareaField,
    SelectField,
    CheckboxField,
    RadioField,
    ColorField,
    ImageField,
    FileField,
    DateField,
    RelationField,
} from './fields';

export default function FieldInput({
    field,
    value,
    onChange,
}: FieldInputProps) {

    switch (field.type) {

        case 'textarea':
        case 'wysiwyg':
            return (
                <TextareaField
                    value={value ?? ''}
                    onChange={onChange}
                />
            );

        case 'select':
            return (
                <SelectField
                    value={value ?? ''}
                    options={field.options ?? []}
                    onChange={onChange}
                />
            );

        case 'checkbox':
            return (
                <CheckboxField
                    value={Array.isArray(value) ? value : []}
                    options={field.options ?? []}
                    onChange={onChange}
                />
            );

        case 'radio':
            return (
                <RadioField
                    name={`radio-${field.id}`}
                    value={value ?? ''}
                    options={field.options ?? []}
                    onChange={onChange}
                />
            );

        case 'color':
            return (
                <ColorField
                    value={value ?? '#000000'}
                    onChange={onChange}
                />
            );

        case 'image':
            return (
                <ImageField
                    value={value}
                    onChange={onChange}
                />
            );

        case 'file':
            return (
                <FileField
                    value={value}
                    onChange={onChange}
                />
            );

        case 'date':
            return (
                <DateField
                    value={value ?? ''}
                    onChange={onChange}
                />
            );

        case 'relation':
            return (
                <RelationField
                    value={value}
                    relations={field.relations ?? []}
                    onChange={onChange}
                />
            );

        default:
            return (
                <TextField
                    value={value ?? ''}
                    placeholder={
                        field.placeholder ??
                        field.instructions ??
                        field.default_value ??
                        undefined
                    }
                    onChange={onChange}
                />
            );
    }
}