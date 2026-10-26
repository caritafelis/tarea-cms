import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
    create as cptCreate,
    edit as cptEdit,
    destroy as cptDestroy,
} from '@/routes/admin/cpt/entries';
import { EntryRow, FieldGroupMeta } from '@/types/page';

interface Props {
    current_team: string;
    cpt: FieldGroupMeta;
    entries: EntryRow[];
}

export default function Index({
    current_team,
    cpt,
    entries,
}: Props) {
    const page = usePage();
    const teamSlug = (page.props as any).currentTeam.slug;
    const cptSlug = cpt.slug

    const handleDelete = (id: number) => {
        if (!confirm('Delete this entry?')) return;
        router.delete(cptDestroy({ current_team: teamSlug, cpt: cptSlug, entry: id }),
        );
    };
    return (
        <>
            <Head title={cpt.standalone_label} />

            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {cpt.standalone_label}
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage your content entries.
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            router.visit(
                                cptCreate({
                                    current_team: teamSlug,
                                    cpt: cptSlug,
                                }),
                            )
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        New Entry
                    </button>
                </div>

                <div className="rounded-xl border overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/40">
                                <th className="p-4 text-left">
                                    Title
                                </th>

                                <th className="p-4 text-left">
                                    Status
                                </th>

                                <th className="p-4 text-left">
                                    Slug
                                </th>

                                <th className="p-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {entries.map((entry) => (
                                <tr
                                    key={entry.id}
                                    className="border-b"
                                >
                                    <td className="p-4">
                                        {entry.title}
                                    </td>

                                    <td className="p-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${entry.status === 'published'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}
                                        >
                                            {entry.status}
                                        </span>
                                    </td>

                                    <td className="p-4 text-neutral-400">
                                        {entry.slug}
                                    </td>

                                    <td className="p-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() =>
                                                    router.visit(
                                                        cptEdit({
                                                            current_team: teamSlug,
                                                            cpt: cptSlug,
                                                            entry: entry.id,
                                                        }),
                                                    )
                                                }
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {entries.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="p-8 text-center text-muted-foreground"
                                    >
                                        No entries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);