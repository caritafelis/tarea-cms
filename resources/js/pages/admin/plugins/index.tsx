import { Head, router } from '@inertiajs/react';
import { Puzzle } from 'lucide-react';
import pluginRoutes from '@/actions/App/Http/Controllers/Admin/PluginController';
import { Muted, StatusBadge } from '@/components/admin/cells';
import { ResourceHeader } from '@/components/admin/resource-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useCan } from '@/hooks/use-can';
import { useTeamSlug } from '@/hooks/use-team-slug';

type Plugin = {
    id: number;
    name: string;
    slug: string;
    version: string | null;
    author: string | null;
    description: string | null;
    is_active: boolean;
};

export default function Index({ plugins }: { plugins: Plugin[] }) {
    const team = useTeamSlug();
    const can = useCan();

    const toggle = (p: Plugin, active: boolean) =>
        router.post(pluginRoutes.toggle.url({ current_team: team, slug: p.slug }), { is_active: active }, { preserveScroll: true });

    return (
        <>
            <Head title="Plugins" />
            <div className="space-y-6 p-6">
                <ResourceHeader title="Plugins" description="Extend the platform with installed plugins." icon={Puzzle} />

                {plugins.length === 0 ? (
                    <p className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
                        No plugins found in <code>app/Plugins</code>.
                    </p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {plugins.map((p) => (
                            <Card key={p.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <CardTitle className="truncate">{p.name}</CardTitle>
                                            <CardDescription>{p.slug}{p.version ? ` · v${p.version}` : ''}</CardDescription>
                                        </div>
                                        <Switch
                                            checked={p.is_active}
                                            disabled={!can('update_plugin')}
                                            onCheckedChange={(v) => toggle(p, v)}
                                            aria-label={`Toggle ${p.name}`}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground">{p.description ?? 'No description.'}</p>
                                    <div className="flex items-center justify-between">
                                        <Muted>{p.author ? `by ${p.author}` : ''}</Muted>
                                        <StatusBadge value={p.is_active ? 'Active' : 'Inactive'} tone={p.is_active ? 'green' : 'gray'} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

Index.layout = { breadcrumbs: [{ title: 'Plugins', href: pluginRoutes.index.url() }] };