import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Trash2 } from 'lucide-react';

import {
    index as acfIndex,
    store as acfStore,
    update as acfUpdate,
} from '@/routes/admin/acf';
import { Field, Cpt, SubField } from '@/types/page';

interface Props {
    group: Cpt | null;
    fieldTypes: string[];
    contentTypes: Record<string, string>;
}

const emptyField = (): Field => ({
    label: '',
    name: '',
    type: 'text',
    required: false,
    order: 0,
    options: null,
    settings: null,
    instructions: null,
    default_value: null,
    sub_fields: [],
    translatable: true,
});

const emptySubField = (): SubField => ({
    label: '',
    name: '',
    type: 'text',
    required: false,
    order: 0,
    options: null,
    settings: null,
    translatable: true,
});

export default function Edit({
    group,
    fieldTypes,
    contentTypes,
}: Props) {
    const isEdit = !!group;

    const { currentTeam } = usePage().props as {
        currentTeam: {
            id: number;
            slug: string;
        };
    };

    const form = useForm({
        title: group?.title ?? '',
        description: group?.description ?? '',
        content_type: group?.content_type ?? 'page',
        is_active: group?.is_active ?? true,

        is_standalone: group?.is_standalone ?? false,
        standalone_label: group?.standalone_label ?? '',
        standalone_icon: group?.standalone_icon ?? '',

        order: group?.order ?? 0,
        fields: group?.fields ?? ([] as Field[]),
    });

    const { data, setData, processing } = form;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const onSuccess = () => {
            router.visit(acfIndex(currentTeam.slug));
        };

        if (isEdit) {
            form.put(acfUpdate([currentTeam.slug, group.id]).url, {
                onSuccess,
            });
        } else {
            form.post(acfStore(currentTeam.slug).url, {
                onSuccess,
            });
        }
    };

    const addField = () => {
        setData('fields', [
            ...data.fields,
            {
                ...emptyField(),
                order: data.fields.length,
            },
        ]);
    };

    const updateField = (
        idx: number,
        key: keyof Field,
        value: any,
    ) => {
        const updated = [...data.fields];

        (updated[idx] as any)[key] = value;

        if (key === 'label' && !updated[idx].id) {
            updated[idx].name = value
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');
        }

        setData('fields', updated);
    };

    const removeField = (idx: number) => {
        setData(
            'fields',
            data.fields.filter((_, i) => i !== idx),
        );
    };

    const addSubField = (fieldIdx: number) => {
        const updated = [...data.fields];

        updated[fieldIdx].sub_fields = [
            ...(updated[fieldIdx].sub_fields ?? []),
            {
                ...emptySubField(),
                order:
                    updated[fieldIdx].sub_fields?.length ?? 0,
            },
        ];

        setData('fields', updated);
    };

    const updateSubField = (
        fieldIdx: number,
        subIdx: number,
        key: keyof SubField,
        value: any,
    ) => {
        const updated = [...data.fields];

        (updated[fieldIdx].sub_fields[subIdx] as any)[key] =
            value;

        if (
            key === 'label' &&
            !updated[fieldIdx].sub_fields[subIdx].id
        ) {
            updated[fieldIdx].sub_fields[subIdx].name = value
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');
        }

        setData('fields', updated);
    };

    const removeSubField = (
        fieldIdx: number,
        subIdx: number,
    ) => {
        const updated = [...data.fields];

        updated[fieldIdx].sub_fields =
            updated[fieldIdx].sub_fields.filter(
                (_, i) => i !== subIdx,
            );

        setData('fields', updated);
    };

    const inputClass =
        'w-full rounded-md border border-sidebar-border/70 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm focus:outline-none';

    return (
        <>
            <Head
                title={
                    isEdit
                        ? 'Edit Field Group'
                        : 'Create Field Group'
                }
            />

            <div className="p-6 max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEdit
                            ? 'Edit Field Group'
                            : 'Create Field Group'}
                    </h1>

                    <button
                        type="button"
                        onClick={() =>
                            router.visit(
                                acfIndex(
                                    currentTeam.slug,
                                ),
                            )
                        }
                        className="text-sm text-neutral-500 hover:text-neutral-800"
                    >
                        ← Backs
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    <div className="rounded-xl border border-sidebar-border/70 bg-white dark:bg-neutral-900 p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                                    Title *
                                </label>

                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData(
                                            'title',
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                                    Content Type *
                                </label>

                                <select
                                    value={data.content_type}
                                    onChange={(e) =>
                                        setData(
                                            'content_type',
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                >
                                    {Object.entries(
                                        contentTypes,
                                    ).map(
                                        ([value, label]) => (
                                            <option
                                                key={value}
                                                value={value}
                                            >
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                                Description
                            </label>

                            <textarea
                                value={
                                    data.description ?? ''
                                }
                                onChange={(e) =>
                                    setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                                rows={2}
                                className={
                                    inputClass +
                                    ' resize-none'
                                }
                            />
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-xl border border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-800/30">
                            <input
                                type="checkbox"
                                id="is_standalone"
                                checked={
                                    data.is_standalone
                                }
                                onChange={(e) =>
                                    setData(
                                        'is_standalone',
                                        e.target.checked,
                                    )
                                }
                                className="rounded"
                            />

                            <div>
                                <label
                                    htmlFor="is_standalone"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    Enable as Standalone
                                    Module (CPT-like)
                                </label>

                                <p className="text-xs text-neutral-500">
                                    This field group
                                    will appear in the
                                    sidebar as its own
                                    content type.
                                </p>
                            </div>
                        </div>

                        {data.is_standalone && (
                            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/50">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                                        Sidebar Label
                                        (plural)
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            data.standalone_label ??
                                            ''
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'standalone_label',
                                                e.target
                                                    .value,
                                            )
                                        }
                                        className={
                                            inputClass
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                                        Icon (Lucide
                                        name)
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            data.standalone_icon ??
                                            ''
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'standalone_icon',
                                                e.target
                                                    .value,
                                            )
                                        }
                                        className={
                                            inputClass
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={
                                        data.is_active
                                    }
                                    onChange={(e) =>
                                        setData(
                                            'is_active',
                                            e.target
                                                .checked,
                                        )
                                    }
                                    className="rounded"
                                />
                                Active
                            </label>

                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold uppercase text-neutral-500">
                                    Order
                                </label>

                                <input
                                    type="number"
                                    value={data.order}
                                    onChange={(e) =>
                                        setData(
                                            'order',
                                            parseInt(
                                                e.target
                                                    .value,
                                            ) || 0,
                                        )
                                    }
                                    className={
                                        inputClass +
                                        ' w-20'
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold uppercase text-neutral-500 tracking-wider">Fields</h2>
                            <button
                                type="button"
                                onClick={addField}
                                className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-dashed border-sidebar-border/70 rounded-lg px-3 py-1.5 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Field
                            </button>
                        </div>

                        {data.fields.length === 0 && (
                            <div className="rounded-xl border-2 border-dashed border-sidebar-border/50 p-8 text-center text-sm text-neutral-400">
                                No fields yet. Click "Add Field" to start.
                            </div>
                        )}

                        {data.fields.map((field, idx) => (
                            <div key={idx} className="rounded-xl border border-sidebar-border/70 bg-white dark:bg-neutral-900 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 border-b border-sidebar-border/50">
                                    <span className="text-xs text-neutral-400 font-mono w-5">#{idx + 1}</span>
                                    <span className="flex-1 text-sm font-medium">{field.label || 'Untitled Field'}</span>
                                    <span className="text-xs bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded font-mono">{field.type}</span>
                                    <button type="button" onClick={() => removeField(idx)} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-500 mb-1">Label *</label>
                                            <input
                                                type="text"
                                                value={field.label}
                                                onChange={e => updateField(idx, 'label', e.target.value)}
                                                className={inputClass}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-500 mb-1">Name (slug) *</label>
                                            <input
                                                type="text"
                                                value={field.name}
                                                onChange={e => updateField(idx, 'name', e.target.value)}
                                                className={inputClass + ' font-mono'}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-500 mb-1">Type *</label>
                                            <select
                                                value={field.type}
                                                onChange={e => updateField(idx, 'type', e.target.value)}
                                                className={inputClass}
                                            >
                                                {fieldTypes.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-500 mb-1">Instructions</label>
                                            <input
                                                type="text"
                                                value={field.instructions ?? ''}
                                                onChange={e => updateField(idx, 'instructions', e.target.value)}
                                                className={inputClass}
                                                placeholder="Helper text for editors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-500 mb-1">Default Value</label>
                                            <input
                                                type="text"
                                                value={field.default_value ?? ''}
                                                onChange={e => updateField(idx, 'default_value', e.target.value)}
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={field.required}
                                            onChange={e => updateField(idx, 'required', e.target.checked)}
                                            className="rounded"
                                        />
                                        Required
                                    </label>

                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={field.translatable ?? false}
                                            onChange={e => updateField(idx, 'translatable', e.target.checked)}
                                            className="rounded"
                                        />
                                        Translatable (value per language)
                                    </label>

                                    {/* Sub-fields for repeater */}
                                    {field.type === 'repeater' && (
                                        <div className="mt-3 space-y-2 pl-4 border-l-2 border-sidebar-border/50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold uppercase text-neutral-400">Sub Fields</span>
                                                <button
                                                    type="button"
                                                    onClick={() => addSubField(idx)}
                                                    className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 border border-dashed border-sidebar-border/70 rounded px-2 py-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Add Sub Field
                                                </button>
                                            </div>

                                            {field.sub_fields.map((sf, sIdx) => (
                                                <div key={sIdx} className="grid grid-cols-3 gap-2 items-end bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
                                                    <div>
                                                        <label className="block text-xs text-neutral-400 mb-1">Label</label>
                                                        <input
                                                            type="text"
                                                            value={sf.label}
                                                            onChange={e => updateSubField(idx, sIdx, 'label', e.target.value)}
                                                            className={inputClass}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-neutral-400 mb-1">Name</label>
                                                        <input
                                                            type="text"
                                                            value={sf.name}
                                                            onChange={e => updateSubField(idx, sIdx, 'name', e.target.value)}
                                                            className={inputClass + ' font-mono'}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <label className="block text-xs text-neutral-400 mb-1">Type</label>
                                                            <select
                                                                value={sf.type}
                                                                onChange={e => updateSubField(idx, sIdx, 'type', e.target.value)}
                                                                className={inputClass}
                                                            >
                                                                {fieldTypes.filter(t => t !== 'repeater').map(t => (
                                                                    <option key={t} value={t}>{t}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <label className="flex items-center gap-1 text-xs">
                                                            <input
                                                                type="checkbox"
                                                                checked={sf.translatable ?? false}
                                                                onChange={e => updateSubField(idx, sIdx, 'translatable', e.target.checked)}
                                                            />
                                                            i18n
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSubField(idx, sIdx)}
                                                            className="mt-5 text-red-400 hover:text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                router.visit(
                                    acfIndex(
                                        currentTeam.slug,
                                    ),
                                )
                            }
                            className="rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 disabled:opacity-60"
                        >
                            {processing
                                ? 'Saving…'
                                : isEdit
                                    ? 'Update Group'
                                    : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Edit.layout = (
    page: React.ReactNode,
) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Field Groups',
                href: '#',
            },
            {
                title: 'Edit',
                href: '#',
            },
        ]}
    >
        {page}
    </AppLayout>
);