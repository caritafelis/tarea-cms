import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { PageItem, PagesProps } from '@/types/page';
import { getTranslation, LANG_LABELS } from '@/types/helpers';

declare const route:
    | ((name: string, params?: Record<string, any>) => string)
    | undefined;

export default function Index({
    pages,
    locales,
    defaultLocale,
}: PagesProps) {
    const { delete: destroy } = useForm({});

    const { props } = usePage();
    const teamSlug = (props as any).currentTeam.slug;

    const pageRoute = (
        name: 'create' | 'edit' | 'destroy',
        id?: number
    ) => {
        if (typeof route === 'function') {
            switch (name) {
                case 'create':
                    return route('admin.pages.create', {
                        current_team: teamSlug,
                    });

                case 'edit':
                    return route('admin.pages.edit', {
                        current_team: teamSlug,
                        page: id,
                    });

                case 'destroy':
                    return route('admin.pages.destroy', {
                        current_team: teamSlug,
                        page: id,
                    });
            }
        }

        switch (name) {
            case 'create':
                return `/${teamSlug}/pages/create`;

            case 'edit':
                return `/${teamSlug}/pages/${id}/edit`;

            case 'destroy':
                return `/${teamSlug}/pages/${id}`;
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm('Move this page to trash?')) return;

        destroy(pageRoute('destroy', id));
    };

    const goToEdit = (id: number) => {
        router.visit(pageRoute('edit', id));
    };

    const goToCreate = () => {
        router.visit(pageRoute('create'));
    };

    const columns = [
        {
            header: 'Title',
            accessor: (p: PageItem) => (
                <div>
                    <button
                        type="button"
                        onClick={() => goToEdit(p.id)}
                        className="font-medium text-neutral-900 dark:text-neutral-100 hover:text-blue-600"
                    >
                        {p[`title_${defaultLocale}`] ||
                            getTranslation(p.title, defaultLocale) ||
                            'Untitled'}
                    </button>

                    <div className="text-xs text-neutral-400">
                        /{p.slug}
                    </div>
                </div>
            ),
        },
        {
            header: 'Author',
            accessor: () => (
                <span className="text-sm text-neutral-500">
                    Admin
                </span>
            ),
        },
        {
            header: 'Status',
            accessor: (p: PageItem) => (
                <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${p.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                        }`}
                >
                    {p.status === 'published' ? (
                        <Eye className="w-3 h-3" />
                    ) : (
                        <EyeOff className="w-3 h-3" />
                    )}

                    {p.status === 'published'
                        ? 'Published'
                        : 'Draft'}
                </span>
            ),
        },
        {
            header: 'Date',
            accessor: (p: PageItem) => (
                <span className="text-sm text-neutral-500">
                    {new Date(p.created_at).toLocaleDateString()}
                </span>
            ),
        },
        {
            header: '',
            accessor: (p: PageItem) => (
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => goToEdit(p.id)}
                        className="text-blue-600"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="text-red-500"
                    >
                        Trash
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Pages" />

            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Pages
                        </h1>

                        <p className="text-sm text-neutral-500">
                            {pages.length} page
                            {pages.length !== 1 ? 's' : ''}

                            {locales.length > 1 && (
                                <span className="ml-2 text-neutral-400">
                                    ·{' '}
                                    {locales
                                        .map(
                                            l =>
                                                LANG_LABELS[l] ?? l
                                        )
                                        .join(', ')}
                                </span>
                            )}
                        </p>
                    </div>

                    <button
                        onClick={goToCreate}
                        className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Page
                    </button>
                </div>

                <DataTable
                    data={pages}
                    columns={columns}
                    searchKey={p =>
                        `${p[`title_${defaultLocale}`] ||
                        getTranslation(
                            p.title,
                            defaultLocale
                        )
                        } ${p.slug}`
                    }
                    searchPlaceholder="Search pages..."
                />
            </div>
        </>
    );
}

Index.layout = () => ({
    breadcrumbs: [
        {
            title: 'Pages',
            href: '/admin/pages',
        },
    ],
});