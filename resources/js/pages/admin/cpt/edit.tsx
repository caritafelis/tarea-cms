import React, { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Trash2 } from 'lucide-react';
import { CptDefinition, EntryData, EntrySection, FieldGroupMeta } from '@/types/page';
import FieldInput from '@/components/pages/field-input';
import Repeater from '@/components/pages/repeater';
import {
    index as cptIndex,
    create as cptCreate,
    edit as cptEdit,
    store as cptStore,
    update as cptUpdate,
    destroy as cptDestroy,
} from '@/routes/admin/cpt/entries';
import { applyUpdate, emptyData } from '@/components/pages/i18n';
import type { ContentSection } from '@/types/page';

interface Props {
    current_team: string;
    cpt: FieldGroupMeta;
    entry: EntryData | null;
    locales?: string[];
    defaultLocale?: string;
}

const inputClass =
    'w-full rounded-md border border-sidebar-border/70 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600';

export default function Edit({ cpt, entry, locales = ['en'], defaultLocale = 'en' }: Props) {
    const [activeLocale, setActiveLocale] = useState(defaultLocale);
    const isEdit = !!entry;

    const page = usePage();
    const teamSlug = (page.props as any).currentTeam.slug;
    const cptSlug = cpt.slug;

    const stored = entry?.sections?.[0] as any;
    const initialLocales: Record<string, Record<string, any>> =
        stored?.locales ??
        Object.fromEntries(locales.map((l) => [l, stored?.data ?? emptyData(cpt.fields)]));


    const form = useForm({
        title: entry?.title ?? '',
        status: entry?.status ?? 'draft',
        sections: [
            { cpt_id: cpt.id, data: initialLocales[defaultLocale] ?? {}, locales: initialLocales },
        ] as EntrySection[],
    });

    const { data, setData, processing, errors } = form;

    const sectionData = (data.sections[0] as any)?.locales?.[activeLocale] ?? {};

    const updateField = (name: string, value: any) => {
        const base = {
            ...(data.sections[0] as any),
            cpt_entry_id: null,
            order: 0,
            group_title: cpt.title,
            group_slug: cpt.slug,
        } as ContentSection;
        const group: any = { ...cpt, is_standalone: false, entries: [] };
        const updated = applyUpdate(base, group, activeLocale, { ...sectionData, [name]: value }, locales, defaultLocale);
        setData('sections', [updated] as any);
    };

    const updateRepeaterRow = (fieldName: string, rowIndex: number, subKey: string, value: any) => {
        const rows = Array.isArray(sectionData[fieldName]) ? [...sectionData[fieldName]] : [];
        rows[rowIndex] = { ...rows[rowIndex], [subKey]: value };
        updateField(fieldName, rows);
    };

    const addRepeaterRow = (fieldName: string, subFields: CptDefinition[]) => {
        const rows = Array.isArray(sectionData[fieldName]) ? [...sectionData[fieldName]] : [];
        const emptyRow: Record<string, any> = {};
        subFields.forEach(sf => {
            emptyRow[sf.name] = sf.default_value ?? '';
        });
        updateField(fieldName, [...rows, emptyRow]);
    };

    const removeRepeaterRow = (fieldName: string, rowIndex: number) => {
        const rows = (sectionData[fieldName] ?? []).filter((_: any, i: number) => i !== rowIndex);
        updateField(fieldName, rows);
    };

    const indexUrl = cptIndex({ current_team: teamSlug, cpt: cptSlug });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const onSuccess = () => router.visit(indexUrl);

        if (isEdit) {
            form.submit(
                cptUpdate({ current_team: teamSlug, cpt: cptSlug, entry: entry!.id }),
                { onSuccess },
            );
        } else {
            form.submit(
                cptStore({ current_team: teamSlug, cpt: cptSlug }),
                { onSuccess },
            );
        }
    };

    return (
        <div className="inset-0 flex h-full bg-neutral-100 dark:bg-neutral-950 overflow-hidden">

            {/* ───────── MAIN ───────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Scroll area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-full mx-auto px-6 py-8 space-y-6">

                        {/* TITLE */}
                        <div>
                            <input
                                type="text"
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                placeholder="Entry title…"
                                className={`w-full text-3xl font-bold bg-transparent border-b-2 pb-3 focus:outline-none
                                ${errors.title
                                        ? 'border-red-400'
                                        : 'border-neutral-200 dark:border-neutral-700 focus:border-neutral-400'
                                    }`}
                            />
                            {errors.title && (
                                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                            )}

                            {isEdit && entry?.slug && (
                                <p className="text-xs text-neutral-400 mt-2">
                                    Slug: <span className="font-mono">{entry.slug}</span>
                                </p>
                            )}
                        </div>

                        {locales.length > 1 && (
                            <div className="flex gap-1">
                                {locales.map((l) => (
                                    <button
                                        key={l}
                                        type="button"
                                        onClick={() => setActiveLocale(l)}
                                        className={`rounded-md border px-3 py-1 text-xs uppercase ${l === activeLocale ? 'bg-neutral-900 text-white' : ''}`}
                                    >
                                        {l}{l === defaultLocale ? ' ★' : ''}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* CPT FIELDS */}
                        {cpt.fields.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                    {cpt.title} Fields
                                </h2>

                                {cpt.fields.map(field => (
                                    <div key={field.id}>
                                        <label className="block text-sm font-medium mb-1">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>

                                        {field.type === 'repeater' ? (
                                            <div className="space-y-2">
                                                {(sectionData[field.name] ?? []).map((row: any, rIdx: number) => (
                                                    <Repeater
                                                        key={rIdx}
                                                        subCpts={field.sub_fields ?? []}
                                                        row={row}
                                                        rowIndex={rIdx}
                                                        onChange={(sk, v) =>
                                                            updateRepeaterRow(field.name, rIdx, sk, v)
                                                        }
                                                        onRemove={() =>
                                                            removeRepeaterRow(field.name, rIdx)
                                                        }
                                                    />
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addRepeaterRow(field.name, field.sub_fields ?? [])
                                                    }
                                                    className="w-full border border-dashed rounded-lg py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                                >
                                                    + Add Row
                                                </button>
                                            </div>
                                        ) : (
                                            <FieldInput
                                                field={field}
                                                value={sectionData[field.name]}
                                                onChange={v => updateField(field.name, v)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ───────── SIDEBAR ───────── */}
            <div className="w-72 xl:w-80 flex-shrink-0 bg-white dark:bg-neutral-900 border-l overflow-y-auto">

                <div className="p-4 space-y-4">

                    {/* Publish */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-3">
                            Publish
                        </h3>

                        <div className="space-y-2">
                            <select
                                value={data.status}
                                onChange={e => setData('status', e.target.value)}
                                className="w-full border rounded-md px-2 py-1.5 text-sm"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing}
                                className="w-full px-4 py-2 text-sm rounded-lg bg-neutral-900 text-white"
                            >
                                {processing
                                    ? 'Saving…'
                                    : isEdit
                                        ? 'Update Entry'
                                        : 'Create Entry'}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.visit(indexUrl)}
                                className="w-full border rounded-lg px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="pt-4 border-t space-y-2 text-sm text-neutral-500">
                        <div>Fields: {cpt.fields.length}</div>
                        {isEdit && <div>Slug: {entry?.slug}</div>}
                    </div>

                </div>
            </div>
        </div>
    );
}

Edit.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'CPT',
            href: '#'
        },
        {
            title: 'Entry',

            href: '#'
        },
    ],
});