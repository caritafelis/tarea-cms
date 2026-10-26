import React, { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    Plus,
    ChevronDown,
    ChevronUp,
    LayoutTemplate,
} from 'lucide-react';

import {
    ContentSection,
    CptDef,
    PageItem,
    SectionData,
} from '@/types/page';

import { LANG_LABELS } from '@/types/helpers';
import Section from '@/components/pages/section';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Label } from '@/components/ui/label';
import { HugeiconsIcon } from '@hugeicons/react';

import {
    WorkflowSquare03Icon,
    LanguageSquareIcon,
    GlobeLockIcon,
    LicenseDraftIcon,
    CheckmarkSquare04Icon,
    Link04Icon,
    Tick02Icon,
    Cancel01Icon,
    Edit01Icon,
} from '@hugeicons/core-free-icons';

import {
    index as pageIndex,
    store as pageStore,
    update as pageUpdate,
} from '@/routes/admin/pages';

import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { WysiwygField } from '@/components/pages/fields/wysiwyg-field';
import { applyUpdate, localizeGroup, localizeSection, newSection } from '@/components/pages/i18n';

function buildInitial(locales: string[], page: PageItem | null) {
    const d: Record<string, any> = {
        status: page?.status ?? 'draft',
        slug: page?.slug ?? "",
        sections: page?.sections ?? [],
    };

    locales.forEach((loc) => {
        d[`title_${loc}`] = page ? page[`title_${loc}`] ?? '' : '';
        d[`content_${loc}`] = page ? page[`content_${loc}`] ?? '' : '';
    });

    return d;
}

interface PageEditorProps {
    page: PageItem | null;
    locales: string[];
    defaultLocale: string;
    availableGroups: CptDef[];
    onClose: () => void;
}

export default function PageEditor({
    page,
    locales,
    defaultLocale,
    availableGroups,
    onClose,
}: PageEditorProps) {
    const isEdit = !!page;

    const [activeLocale, setActiveLocale] = useState(defaultLocale);
    const [showAddSection, setShowAddSection] = useState(false);
    const [seoOpen, setSeoOpen] = useState(false);
    const [discussionOpen, setDiscussionOpen] = useState(false);
    const [editingPermalink, setEditingPermalink] = useState(false);
    const baseUrl = `${window.location.origin}/pages`;
    const { props } = usePage();
    const teamSlug = (props as any).currentTeam.slug;

    const form = useForm(buildInitial(locales, page));

    const {
        data,
        setData,
        processing,
        errors,
    } = form;

    const sections: ContentSection[] =
        ((data as any).sections as ContentSection[]) ?? [];

    const setSections = (
        updater:
            | ContentSection[]
            | ((prev: ContentSection[]) => ContentSection[])
    ) => {
        setData(
            'sections' as any,
            typeof updater === 'function'
                ? updater(sections)
                : updater,
        );
    };

    const indexUrl = pageIndex({
        current_team: teamSlug,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const onSuccess = () => router.visit(indexUrl);

        if (isEdit) {
            form.submit(
                pageUpdate({
                    current_team: teamSlug,
                    page: page!.id,
                }),
                {
                    onSuccess,
                },
            );
        } else {
            form.submit(
                pageStore({
                    current_team: teamSlug,
                }),
                {
                    onSuccess,
                },
            );
        }
    };

    const addSection = (group: CptDef) => {
        setSections((prev) => [...prev, newSection(group, locales, defaultLocale, prev.length)]);
        setShowAddSection(false);
    };

    const updateSection = (idx: number, data: SectionData) =>
        setSections((prev) =>
            prev.map((s, i) =>
                i === idx
                    ? applyUpdate(s, groupById(s.cpt_id), activeLocale, data, locales, defaultLocale)
                    : s,
            ),
        );

    const removeSection = (index: number) => {
        setSections((prev) =>
            prev.filter((_, i) => i !== index),
        );
    };

    const moveSection = (
        index: number,
        direction: -1 | 1,
    ) => {
        setSections((prev) => {
            const next = [...prev];

            const swapIndex = index + direction;

            if (
                swapIndex < 0 ||
                swapIndex >= next.length
            ) {
                return prev;
            }

            [next[index], next[swapIndex]] = [
                next[swapIndex],
                next[index],
            ];

            return next.map((section, order) => ({
                ...section,
                order,
            }));
        });
    };

    const groupById = (id: number) =>
        availableGroups.find((group) => group.id === id);

    const titleForLocale =
        (data as any)[`title_${activeLocale}`] ?? '';

    const contentForLocale =
        (data as any)[`content_${activeLocale}`] ?? '';

    const errorKey = `title_${activeLocale}`;
    const errorMessage = (errors as any)[errorKey];
    const contentErrorKey = `content_${activeLocale}`;
    const contentErrorMessage = (errors as any)[contentErrorKey];

    return (
        <div className="inset-0 flex bg-neutral-100 dark:bg-neutral-950 overflow-x-auto h-full">
            {/* flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 */}

            {/* ── Main area ─────────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-full mx-auto px-6 py-8 space-y-6">

                        {/* Title field */}
                        <div>
                            <input
                                type="text"
                                value={titleForLocale}
                                onChange={e => setData(`title_${activeLocale}` as any, e.target.value)}
                                placeholder="Add title"
                                className={`w-full text-3xl font-bold bg-transparent border-0 border-b-2 pb-3 focus:outline-none placeholder:text-neutral-300 dark:placeholder:text-neutral-600 transition-colors ${(errors as any)[`title_${activeLocale}`]
                                    ? 'border-red-400'
                                    : 'border-neutral-200 dark:border-neutral-700 focus:border-neutral-400'
                                    }`}
                            />
                            {(errors as any)[`title_${activeLocale}`] && (
                                <p className="text-red-500 text-xs mt-1">{(errors as any)[`title_${activeLocale}`]}</p>
                            )}
                            {isEdit && page?.slug && (
                                <Field>
                                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 flex-wrap">
                                        <FieldLabel className="m-0 font-medium whitespace-nowrap">
                                            Permalink:
                                        </FieldLabel>

                                        {!editingPermalink ? (
                                            <>
                                                <FieldDescription className="m-0">
                                                    <a
                                                        href={`${baseUrl}/${(data as any).slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-foreground hover:underline break-all"
                                                    >
                                                        {baseUrl}/{(data as any).slug || "my-page-slug"}
                                                    </a>
                                                </FieldDescription>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs"
                                                    onClick={() => setEditingPermalink(true)}
                                                >
                                                    <HugeiconsIcon icon={Edit01Icon} />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="whitespace-nowrap text-neutral-500">
                                                    {baseUrl}/
                                                </span>

                                                <InputGroup className="w-56">
                                                    <InputGroupInput
                                                        value={(data as any).slug}
                                                        onChange={(e) =>
                                                            setData("slug" as any, e.target.value)
                                                        }
                                                        placeholder="my-post-slug"
                                                        className="text-xs"
                                                    />
                                                </InputGroup>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs"
                                                    onClick={() => setEditingPermalink(false)}
                                                >
                                                    <HugeiconsIcon icon={Tick02Icon} />
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs"
                                                    onClick={() => {
                                                        setData("slug" as any, page?.slug ?? "");
                                                        setEditingPermalink(false);
                                                    }}
                                                >
                                                    <HugeiconsIcon icon={Cancel01Icon} />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Field>
                            )}
                        </div>

                        {/* Content editor */}
                        {/* Content editor */}
                        <FieldGroup className="w-full">
                            <Field>
                                <FieldLabel htmlFor="post-content" className="sr-only">
                                    Page Content
                                </FieldLabel>

                                <WysiwygField
                                    value={contentForLocale}
                                    onChange={(html) =>
                                        setData(`content_${activeLocale}` as any, html)
                                    }
                                    placeholder="Start writing your post content here..."
                                />

                                {contentErrorMessage && (
                                    <FieldDescription className="mt-2 text-xs text-red-500">
                                        {contentErrorMessage}
                                    </FieldDescription>
                                )}
                            </Field>
                        </FieldGroup>

                        {/* Dynamic sections */}
                        {sections.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                                    <LayoutTemplate className="w-4 h-4" /> Custom Sections
                                </h3>
                                {sections.map((sec, idx) => (
                                    <Section
                                        key={`${sec.cpt_id}-${idx}`}
                                        section={localizeSection(sec, activeLocale)}
                                        groupDef={localizeGroup(groupById(sec.cpt_id), activeLocale)}
                                        index={idx}
                                        onUpdate={(section) => updateSection(idx, section)}
                                        onRemove={() => removeSection(idx)}
                                        onMoveUp={() => moveSection(idx, -1)}
                                        onMoveDown={() => moveSection(idx, 1)}
                                        isFirst={idx === 0}
                                        isLast={idx === sections.length - 1}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Add section picker */}
                        {availableGroups.length > 0 && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowAddSection(s => !s)}
                                    className="flex items-center gap-2 w-full justify-center py-3 rounded-xl border-2 border-dashed border-sidebar-border/60 hover:border-neutral-400 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Add Custom Section
                                </button>

                                {showAddSection && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-sidebar-border/70 rounded-xl shadow-xl z-20 overflow-hidden">
                                        <div className="p-3 border-b border-sidebar-border/50">
                                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                                Choose section type
                                            </p>
                                        </div>
                                        <div className="divide-y divide-sidebar-border/30 max-h-64 overflow-y-auto">
                                            {availableGroups.map(g => (
                                                <button
                                                    key={g.id}
                                                    type="button"
                                                    onClick={() => addSection(g)}
                                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                                >
                                                    <LayoutTemplate className="w-4 h-4 text-neutral-400 shrink-0" />
                                                    <div>
                                                        <div className="font-medium">{g.title}</div>
                                                        <div className="text-xs text-neutral-400">
                                                            {g.fields.length} field{g.fields.length !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="p-2 border-t border-sidebar-border/50">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddSection(false)}
                                                className="w-full text-xs text-neutral-400 hover:text-neutral-600 py-1"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Right Sidebar ──────────────────────────────────────────────────── */}
            <div className="w-72 xl:w-80 shrink-0 bg-white dark:bg-neutral-900 border-l border-sidebar-border/70 overflow-y-auto flex flex-col">

                {/* Publish box */}
                <div className="border-b border-sidebar-border/60">

                    <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Publish</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                                <HugeiconsIcon icon={LanguageSquareIcon} size={20} />
                                <Label>Language</Label>
                            </span>
                            {/* Locale */}
                            {locales.length > 1 && (
                                <div className="flex items-center shrink-0">
                                    <Select value={activeLocale} onValueChange={setActiveLocale}>
                                        <SelectTrigger className="w-[150px] text-xs rounded-full py-1">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>

                                        <SelectContent position='popper' align='end'>
                                            {locales.map((loc) => (
                                                <SelectItem
                                                    key={loc}
                                                    value={loc}
                                                    className="text-xs cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800"
                                                >
                                                    <div className="flex items-center gap-2 w-full justify-between">
                                                        <span>{LANG_LABELS[loc] ?? loc.toUpperCase()}</span>

                                                        {loc === defaultLocale && (
                                                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-normal">
                                                                default
                                                            </span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                                <HugeiconsIcon icon={WorkflowSquare03Icon} size={20} />
                                <Label>Status</Label>
                            </span>
                            <Select
                                value={(data as any).status}
                                onValueChange={(value) => setData('status' as any, value)}
                            >
                                <SelectTrigger className="w-[150px] text-xs rounded-full py-1">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>

                                <SelectContent position='popper' align='end'>
                                    <SelectItem value="draft" className="text-xs cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800">
                                        <HugeiconsIcon icon={LicenseDraftIcon} />
                                        <Label>Draft</Label>
                                    </SelectItem>
                                    <SelectItem value="published" className="text-xs cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-800">
                                        <HugeiconsIcon icon={CheckmarkSquare04Icon} />
                                        <Label>Published</Label>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                                <HugeiconsIcon icon={GlobeLockIcon} size={20} />
                                <Label>Visibility</Label>
                            </span>
                            <span className="text-neutral-500 text-xs">Public</span>
                        </div>

                        {isEdit && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                                    <HugeiconsIcon icon={Link04Icon} />
                                    <Label>Slug</Label>
                                </span>
                                <span className="text-neutral-400 text-xs truncate max-w-[130px]">{page?.slug ?? '—'}</span>
                            </div>
                        )}

                        <div className="pt-1 space-y-2">
                            <Button
                                onClick={handleSubmit}
                                disabled={processing}
                                className="w-full font-medium"
                            >
                                {processing ? 'Saving…' : isEdit ? 'Update Page' : 'Publish Page'}
                            </Button>


                            <Button
                                variant="destructive"
                                onClick={onClose}
                                className="w-full text-sm font-medium"
                            >
                                {isEdit ? '← Discard Changes' : 'Cancel'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Page Attributes */}
                <div className="border-b border-sidebar-border/60">
                    <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Page Attributes</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Parent Page</label>
                            <select className="w-full border border-sidebar-border/70 rounded-md px-2 py-1.5 bg-white dark:bg-neutral-800 text-sm focus:outline-none">
                                <option value="">(no parent)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Order</label>
                            <input
                                type="number"
                                defaultValue={0}
                                className="w-full border border-sidebar-border/70 rounded-md px-2 py-1.5 bg-white dark:bg-neutral-800 text-sm focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* SEO */}
                <div className="border-b border-sidebar-border/60">
                    <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        onClick={() => setSeoOpen(s => !s)}
                    >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">SEO</h3>
                        {seoOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                    </button>
                    {seoOpen && (
                        <div className="p-4 space-y-3">
                            {([
                                ['Meta Title', 'text', 'SEO title…'],
                                ['Meta Description', 'textarea', 'Brief description…'],
                                ['Canonical URL', 'url', 'https://…'],
                            ] as const).map(([label, type, placeholder]) => (
                                <div key={label}>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">{label}</label>
                                    {type === 'textarea' ? (
                                        <textarea
                                            rows={3}
                                            placeholder={placeholder}
                                            className="w-full rounded-md border border-sidebar-border/70 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none resize-none"
                                        />
                                    ) : (
                                        <input
                                            type={type}
                                            placeholder={placeholder}
                                            className="w-full rounded-md border border-sidebar-border/70 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Discussion */}
                <div className="border-b border-sidebar-border/60">
                    <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        onClick={() => setDiscussionOpen(s => !s)}
                    >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Discussion</h3>
                        {discussionOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                    </button>
                    {discussionOpen && (
                        <div className="p-4 space-y-2">
                            {['Allow comments', 'Allow trackbacks'].map(label => (
                                <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" className="rounded border-sidebar-border/70" /> {label}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sections summary */}
                {sections.length > 0 && (
                    <div className="border-b border-sidebar-border/60">
                        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                Sections ({sections.length})
                            </h3>
                        </div>
                        <div className="p-3 space-y-1">
                            {sections.map((sec, idx) => {
                                const g = groupById(sec.cpt_id);
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 text-xs px-2 py-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    >
                                        <LayoutTemplate className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                        <span className="text-neutral-700 dark:text-neutral-300 truncate">
                                            {g?.title ?? `Group #${sec.cpt_id}`}
                                        </span>
                                        <span className="ml-auto text-neutral-400">#{idx + 1}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}