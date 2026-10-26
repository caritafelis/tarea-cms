import { CptDefinition } from '@/types/page';

export interface FieldOption {
    label: string;
    value: string;
}

export interface BaseFieldProps<T = any> {
    value: T;
    onChange: (value: T) => void;
}

export interface TextFieldProps extends BaseFieldProps<string> {
    placeholder?: string;
}

export interface SelectFieldProps extends BaseFieldProps<string> {
    options: FieldOption[];
}

export interface CheckboxFieldProps extends BaseFieldProps<string[]> {
    options: FieldOption[];
}

export interface RadioFieldProps extends BaseFieldProps<string> {
    name: string;
    options: FieldOption[];
}

export interface RelationFieldProps extends BaseFieldProps<number | null> {
    relations: {
        id: number;
        title: string;
    }[];
}

export interface FieldInputProps {
    field: CptDefinition;
    value: any;
    onChange: (value: any) => void;
}