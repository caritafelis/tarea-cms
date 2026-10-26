import React, { useState } from 'react';
import {
    Plus,
    Trash2,
    GripVertical,
    ChevronDown,
    ChevronUp,
    LayoutTemplate,
} from 'lucide-react';

import {
    ContentSection,
    CptDefinition,
    CptDef,
    SectionData,
} from '@/types/page';

import Repeater from './repeater';
import FieldInput from './field-input';

interface SectionProps {
    section: ContentSection;
    groupDef: CptDef | undefined;
    index: number;
    onUpdate: (data: SectionData) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
}

export default function Section({
    section,
    groupDef,
    index,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
}: SectionProps) {
    const [collapsed, setCollapsed] = useState(false);

    const selectedEntry =
        (section.data as any).cpt_entry_id ??
        '';

    const updateSection = (data: SectionData) => {
        onUpdate(data);
    };

    const updateField = (name: string, value: any) => {
        updateSection({
            ...section.data,
            [name]: value,
        });
    };

    const updateRepeaterRow = (
        fieldName: string,
        rowIndex: number,
        subKey: string,
        value: any,
    ) => {
        const rows = Array.isArray(section.data[fieldName])
            ? [...section.data[fieldName]]
            : [];

        rows[rowIndex] = {
            ...rows[rowIndex],
            [subKey]: value,
        };

        updateSection({
            ...section.data,
            [fieldName]: rows,
        });
    };

    const addRepeaterRow = (fieldName: string, subFields: CptDefinition[]) => {
        const rows = Array.isArray(section.data[fieldName])
            ? [...section.data[fieldName]]
            : [];

        const emptyRow: SectionData = {};

        subFields.forEach(sf => {
            emptyRow[sf.name] = sf.default_value ?? '';
        });

        updateSection({
            ...section.data,
            [fieldName]: [...rows, emptyRow],
        });
    };

    const removeRepeaterRow = (fieldName: string, rowIndex: number) => {
        updateSection({
            ...section.data,
            [fieldName]: (section.data[fieldName] ?? []).filter(
                (_: any, i: number) => i !== rowIndex
            ),
        });
    };

    if (!groupDef) {
        return (
            <div className="rounded-xl border border-dashed border-red-300 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600">
                Field group not found (id: {section.cpt_id})
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-white shadow-sm dark:bg-neutral-900">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-sidebar-border/50 bg-neutral-50 px-4 py-3 dark:bg-neutral-800/60">
                <GripVertical className="h-4 w-4 flex-shrink-0 text-neutral-400" />

                <LayoutTemplate className="h-4 w-4 flex-shrink-0 text-neutral-500" />

                <span className="flex-1 text-sm font-medium">
                    {groupDef.title}
                </span>

                <div className="flex items-center gap-1">
                    {!isFirst && (
                        <button
                            type="button"
                            onClick={onMoveUp}
                            className="rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </button>
                    )}

                    {!isLast && (
                        <button
                            type="button"
                            onClick={onMoveDown}
                            className="rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setCollapsed((c) => !c)}
                        className="ml-1 rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    >
                        {collapsed ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onRemove}
                        className="ml-1 rounded p-1 text-neutral-400 transition-colors hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!collapsed && (
                <div className="space-y-4 p-4">

                    {groupDef.is_standalone && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {groupDef.standalone_label ?? 'Entry'}
                            </label>

                            <select
                                className="w-full rounded-lg border border-sidebar-border/70 bg-white px-3 py-2 text-sm dark:bg-neutral-800"
                                value={selectedEntry}
                                onChange={(e) => {
                                    const value = e.target.value
                                        ? Number(e.target.value)
                                        : null;
                                    const entry = groupDef.entries.find(
                                        (item) => item.id === value
                                    );
                                    onUpdate({
                                        ...section.data,
                                        ...(entry?.data ?? {}),
                                        cpt_entry_id: value,
                                    });
                                }}
                            >
                                <option value="">
                                    Seleccione...
                                </option>

                                {groupDef.entries.map((entry) => (
                                    <option
                                        key={entry.id}
                                        value={entry.id}
                                    >
                                        {entry.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!groupDef.is_standalone &&
                        groupDef.fields.map((field) => (
                            <div key={field.id}>
                                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    {field.label}

                                    {field.required && (
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    )}
                                </label>

                                {field.instructions && (
                                    <p className="mb-1.5 text-xs text-neutral-500">
                                        {field.instructions}
                                    </p>
                                )}

                                {field.type === 'repeater' ? (
                                    <div className="space-y-2">
                                        {(section.data[field.name] ?? []).map(
                                            (
                                                row: SectionData,
                                                rIdx: number,
                                            ) => (
                                                <Repeater
                                                    key={rIdx}
                                                    subCpts={
                                                        field.sub_fields ?? []
                                                    }
                                                    row={row}
                                                    rowIndex={rIdx}
                                                    onChange={(k, v) =>
                                                        updateRepeaterRow(
                                                            field.name,
                                                            rIdx,
                                                            k,
                                                            v,
                                                        )
                                                    }
                                                    onRemove={() =>
                                                        removeRepeaterRow(
                                                            field.name,
                                                            rIdx,
                                                        )
                                                    }
                                                />
                                            ),
                                        )}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                addRepeaterRow(
                                                    field.name,
                                                    field.sub_fields ?? [],
                                                )
                                            }
                                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-sidebar-border/70 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Row
                                        </button>
                                    </div>
                                ) : (
                                    <FieldInput
                                        field={field}
                                        value={section.data[field.name]}
                                        onChange={(v) =>
                                            updateField(field.name, v)
                                        }
                                    />
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}