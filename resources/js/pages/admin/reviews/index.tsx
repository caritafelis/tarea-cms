import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Star } from 'lucide-react';
import { useState } from 'react';
import reviewRoutes from '@/actions/App/Http/Controllers/Admin/ReviewController';
import { Muted, NameCell, StatusBadge } from '@/components/admin/cells';
import { ConfirmDelete } from '@/components/admin/confirm-delete';
import { ResourceHeader } from '@/components/admin/resource-header';
import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { formatDate } from '@/lib/format';

type Review = {
    id: number;
    rating: number;
    title: string | null;
    content: string | null;
    approved: boolean;
    created_at: string;
    author?: { name?: string; email?: string } | null;
    reviewrateable?: { name?: string; title?: string } | null;
};

const stars = (n: number) => '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(5 - Math.max(0, Math.min(5, n)));

export default function Index({ reviews }: { reviews: Review[] }) {
    const team = useTeamSlug();
    const can = useCan();
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
    const [pendingDelete, setPendingDelete] = useState<Review | null>(null);

    const rows = reviews.filter((r) => (filter === 'all' ? true : filter === 'approved' ? r.approved : !r.approved));
    const toggle = (r: Review) =>
        router.put(reviewRoutes.update.url({ current_team: team, review: r.id }), { approved: !r.approved }, { preserveScroll: true });

    const columns: ColumnDef<Review>[] = [
        {
            id: 'review',
            header: 'Review',
            cell: ({ row }) => (
                <div className="max-w-md">
                    <p className="text-amber-500">{stars(row.original.rating)}</p>
                    <NameCell title={row.original.title ?? '(no title)'} subtitle={row.original.content} />
                </div>
            ),
        },
        {
            id: 'target',
            header: 'Product',
            cell: ({ row }) => <Muted>{row.original.reviewrateable?.name ?? row.original.reviewrateable?.title ?? '—'}</Muted>,
            meta: { className: 'hidden md:table-cell' },
        },
        {
            id: 'author',
            header: 'Author',
            cell: ({ row }) => <Muted>{row.original.author?.name ?? row.original.author?.email ?? 'Anonymous'}</Muted>,
            meta: { className: 'hidden md:table-cell' },
        },
        { id: 'date', header: 'Date', cell: ({ row }) => <Muted>{formatDate(row.original.created_at)}</Muted>, meta: { className: 'hidden lg:table-cell' } },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge value={row.original.approved ? 'Approved' : 'Pending'} tone={row.original.approved ? 'green' : 'amber'} />,
        },
        {
            id: 'actions',
            header: '',
            meta: { className: 'text-right' },
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    {can('update_review') && (
                        <Button size="sm" variant="outline" onClick={() => toggle(row.original)}>
                            {row.original.approved ? 'Unapprove' : 'Approve'}
                        </Button>
                    )}
                    {can('delete_review') && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setPendingDelete(row.original)}>
                            Delete
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Reviews" />
            <div className="space-y-6 p-6">
                <ResourceHeader title="Reviews" description="Moderate customer reviews before they go live." icon={Star} />

                <div className="flex gap-2">
                    {(['all', 'pending', 'approved'] as const).map((f) => (
                        <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">
                            {f}
                        </Button>
                    ))}
                </div>

                <DataTable columns={columns} data={rows} emptyState={<p className="py-12 text-sm text-muted-foreground">No reviews found.</p>} />
            </div>

            <ConfirmDelete
                open={!!pendingDelete}
                title="Delete this review?"
                onCancel={() => setPendingDelete(null)}
                onConfirm={() =>
                    pendingDelete &&
                    router.delete(reviewRoutes.destroy.url({ current_team: team, review: pendingDelete.id }), {
                        preserveScroll: true,
                        onFinish: () => setPendingDelete(null),
                    })
                }
            />
        </>
    );
}

Index.layout = { breadcrumbs: [{ title: 'Reviews', href: reviewRoutes.index.url() }] };