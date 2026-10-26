import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';

import {
    create as acfCreate,
    edit as acfEdit,
    destroy as acfDestroy,
} from '@/routes/admin/acf';
import { Cpt } from '@/types/page';

interface Props {
    groups: Cpt[];
    contentTypes: Record<string, string>;
}

export default function CptsIndex({
    groups,
    contentTypes,
}: Props) {
    const page = usePage();

    const teamSlug = (page.props as any).currentTeam.slug;

    const handleDelete = (id: number) => {
        if (!confirm('Delete this field group?')) {
            return;
        }

        router.delete(
            acfDestroy({
                current_team: teamSlug,
                acf: id,
            }),
        );
    };

    const columns = [
        {
            header: 'Title',
            accessor: (g: Cpt) => (
                <div>
                    <div className="font-medium">{g.title}</div>
                    <div className="text-xs text-neutral-400">
                        {g.slug}
                    </div>
                </div>
            ),
        },
        {
            header: 'Content Type',
            accessor: (g: Cpt) => (
                <span className="text-sm">
                    {contentTypes[g.content_type] ??
                        g.content_type}
                </span>
            ),
        },
        {
            header: 'Fields',
            accessor: (g: Cpt) => (
                <span className="text-sm text-neutral-500">
                    {g.fields_count} field
                    {g.fields_count !== 1 ? 's' : ''}
                </span>
            ),
        },
        {
            header: 'Status',
            accessor: (g: Cpt) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${g.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-neutral-100 text-neutral-500'
                        }`}
                >
                    {g.is_active
                        ? 'Active'
                        : 'Inactive'}
                </span>
            ),
        },
        {
            header: '',
            accessor: (g: Cpt) => (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() =>
                            router.visit(
                                acfEdit({
                                    current_team:
                                        teamSlug,
                                    acf: g.id,
                                }),
                            )
                        }
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                    </button>

                    <button
                        onClick={() =>
                            handleDelete(g.id)
                        }
                        className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Field Groups" />

            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Field Groups
                        </h1>

                        <p className="text-sm text-neutral-500 mt-0.5">
                            Define custom fields for
                            posts, pages and products
                            (like ACF).
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            router.visit(
                                acfCreate(
                                    teamSlug,
                                ),
                            )
                        }
                        className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
                    >
                        <Plus className="w-4 h-4" />
                        Add Field Group
                    </button>
                </div>

                <DataTable
                    data={groups}
                    columns={columns}
                    searchKey={(g) =>
                        `${g.title} ${g.slug}`
                    }
                    searchPlaceholder="Search field groups…"
                />
            </div>
        </>
    );
}

CptsIndex.layout = (
    page: React.ReactNode,
) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Field Groups',
                href: '#',
            },
        ]}
    >
        {page}
    </AppLayout>
);