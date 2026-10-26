import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DataTable from '@/components/DataTable';
import { CptDef } from '@/types/page';
import { PostItem } from '@/types/post';

interface PostsProps {
    posts: PostItem[];
    locales: string[];
    defaultLocale: string;
    availableGroups: CptDef[];
}

export default function Index({ posts, defaultLocale }: PostsProps) {
    const { props } = usePage();
    const teamSlug = (props as any).currentTeam.slug;

    const getTranslation = (field: any, lang: string): string => {
        if (!field) return '';
        if (typeof field === 'string') {
            try { return JSON.parse(field)[lang] ?? ''; } catch { return field; }
        }
        return field[lang] ?? field[defaultLocale] ?? '';
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this post?')) {
            router.delete(`/${teamSlug}/posts/${id}`);
        }
    };

    const columns = [
        { header: 'Title', accessor: (p: PostItem) => getTranslation(p.title, defaultLocale) },
        { header: 'Slug', accessor: (p: PostItem) => p.slug },
        {
            header: 'Status',
            accessor: (p: PostItem) => (
                <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${p.status === 'published'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>{p.status}</span>
            ),
        },
        { header: 'Created', accessor: (p: PostItem) => new Date(p.created_at).toLocaleDateString() },
        {
            header: 'Actions',
            accessor: (p: PostItem) => (
                <div className="flex gap-2">
                    <Link href={`/${teamSlug}/posts/${p.id}/edit`} className="text-sm text-blue-600 hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(p.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Posts" />
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
                        <p className="text-sm text-neutral-500">Manage blog posts and content translations.</p>
                    </div>
                    <Link
                        href={`/${teamSlug}/posts/create`}
                        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                    >
                        Add New Post
                    </Link>
                </div>

                <DataTable
                    data={posts}
                    columns={columns}
                    searchKey={(p) => getTranslation(p.title, defaultLocale) + ' ' + p.slug}
                    searchPlaceholder="Search posts..."
                />
            </div>
        </>
    );
}

Index.layout = () => ({
    breadcrumbs: [{ title: 'Posts', href: '/admin/posts' }],
});