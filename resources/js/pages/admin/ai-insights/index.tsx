import { Head, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import aiRoutes from '@/actions/App/Http/Controllers/Admin/AIInsightsController';
import { Muted, NameCell } from '@/components/admin/cells';
import { ResourceHeader } from '@/components/admin/resource-header';
import InputError from '@/components/input-error';
import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCan } from '@/hooks/use-can';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { formatDate } from '@/lib/format';

type Source = { id: number; title: string };
type Insight = {
    id: number;
    llm_score: number | string | null;
    llm_detection_result: string | null;
    recommendations: string[] | null;
    created_at: string;
    post?: Source | null;
    page?: Source | null;
};

const percent = (v: Insight['llm_score']) => {
    const n = Number(v ?? 0);
    return Math.max(0, Math.min(100, n <= 1 ? n * 100 : n));
};

export default function Index({ insights, posts, pages }: { insights: Insight[]; posts: Source[]; pages: Source[] }) {
    const team = useTeamSlug();
    const can = useCan();
    const [kind, setKind] = useState<'post' | 'page'>('post');
    const form = useForm({ post_id: '', page_id: '' });
    const sources = kind === 'post' ? posts : pages;
    const errors = form.errors as Record<string, string | undefined>;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((d) => ({ post_id: kind === 'post' ? d.post_id : '', page_id: kind === 'page' ? d.page_id : '' }));
        form.post(aiRoutes.detect.url({ current_team: team }), { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const selected = kind === 'post' ? form.data.post_id : form.data.page_id;

    const columns: ColumnDef<Insight>[] = [
        {
            id: 'source',
            header: 'Content',
            cell: ({ row }) => (
                <NameCell title={row.original.post?.title ?? row.original.page?.title ?? '(deleted)'} subtitle={row.original.post ? 'Post' : 'Page'} />
            ),
        },
        {
            id: 'score',
            header: 'LLM score',
            cell: ({ row }) => {
                const pct = percent(row.original.llm_score);
                return (
                    <div className="flex w-40 items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold tabular-nums">{pct.toFixed(0)}%</span>
                    </div>
                );
            },
        },
        {
            id: 'result',
            header: 'Result',
            cell: ({ row }) => <Muted className="line-clamp-2 max-w-md">{row.original.llm_detection_result ?? '—'}</Muted>,
            meta: { className: 'hidden md:table-cell' },
        },
        { id: 'date', header: 'Analyzed', cell: ({ row }) => <Muted>{formatDate(row.original.created_at, true)}</Muted>, meta: { className: 'hidden lg:table-cell' } },
    ];

    return (
        <>
            <Head title="AI Insights" />
            <div className="space-y-6 p-6">
                <ResourceHeader title="AI Insights" description="Detect AI-generated content in your posts and pages." icon={Sparkles} />

                {can('view_any_ai_insight') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>New analysis</CardTitle>
                            <CardDescription>Pick a post or a page to score.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="grid items-end gap-4 sm:grid-cols-[10rem_1fr_auto]">
                                <div className="space-y-1.5">
                                    <Label>Content type</Label>
                                    <Select value={kind} onValueChange={(v) => setKind(v as 'post' | 'page')}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="post">Post</SelectItem>
                                            <SelectItem value="page">Page</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{kind === 'post' ? 'Post' : 'Page'}</Label>
                                    <Select
                                        value={String(selected ?? '')}
                                        onValueChange={(v) => form.setData(kind === 'post' ? 'post_id' : 'page_id', v)}
                                    >
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
                                        <SelectContent>
                                            {sources.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={form.processing || !selected}>
                                    {form.processing ? 'Analyzing…' : 'Analyze'}
                                </Button>
                            </form>
                            <InputError className="mt-2" message={errors.error ?? errors.post_id ?? errors.page_id} />
                        </CardContent>
                    </Card>
                )}

                <DataTable columns={columns} data={insights} emptyState={<p className="py-12 text-sm text-muted-foreground">No analyses yet.</p>} />
            </div>
        </>
    );
}

Index.layout = { breadcrumbs: [{ title: 'AI Insights', href: aiRoutes.index.url() }] };