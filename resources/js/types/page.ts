export interface RelationOption {
    id: number;
    title: string;
}

export interface EntryOption {
    id: number;
    title: string;
    data?: Record<string, any>;
    locales?: Record<string, Record<string, any>>;
}

export interface CptDefinition {
    id: number;
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: { label: string; value: string }[] | null;
    settings?: string | null;
    instructions?: string | null;
    default_value?: string | null;
    sub_fields?: CptDefinition[];
    relations?: RelationOption[];
    multiple?: boolean;
    accepts?: string[];
    placeholder?: string | null;
    translatable?: boolean;
}

export interface CptDef {
    id: number;
    title: string;
    slug: string;
    is_standalone: boolean;
    standalone_label: string | null;
    standalone_icon: string | null;
    entries: EntryOption[];
    fields: CptDefinition[];
}

export interface FieldGroupMeta {
    id: number;
    title: string;
    slug: string;
    standalone_label: string;
    standalone_icon?: string | null;
    fields: CptDefinition[];
}

export interface EntryRow {
    id: number;
    title: string;
    slug: string;
    status: string;
    created_at: string;
}

export interface EntrySection {
    field_group_id?: number;
    cpt_id?: number;
    data: Record<string, any>;
    locales?: Record<string, SectionData>;
}

export interface EntryData {
    id: number;
    title: string;
    slug: string;
    status: string;
    sections: EntrySection[];
}

export interface SectionData {
    [key: string]: any;
}

export interface SubField {
    id?: number;
    label: string;
    name: string;
    type: string;
    required: boolean;
    order: number;
    options: any[] | null;
    settings: any | null;
    translatable?: boolean;
}

export interface Field {
    id?: number;
    label: string;
    name: string;
    type: string;
    required: boolean;
    order: number;
    options: any[] | null;
    settings: any | null;
    instructions: string | null;
    default_value: string | null;
    sub_fields: SubField[];
    translatable?: boolean;
}

export interface Cpt {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    content_type: string;
    is_active: boolean;
    is_standalone: boolean;
    standalone_label: string | null;
    standalone_icon: string | null;
    order: number;
    fields_count: number;
    fields: Field[];
}

export interface ContentSection {
    section_id?: number;
    cpt_id: number;
    cpt_entry_id: number | null;
    order: number;
    group_title: string;
    group_slug: string;
    data: SectionData;
    locales?: Record<string, SectionData>;
}

export interface PageItem {
    id: number;
    [key: string]: any;
    slug: string;
    status: string;
    created_at: string;
    sections?: ContentSection[];
}

export interface PagesProps {
    pages: PageItem[];
    locales: string[];
    defaultLocale: string;
    availableGroups?: CptDef[];
}