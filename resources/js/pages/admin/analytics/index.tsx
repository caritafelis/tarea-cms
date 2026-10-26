import { Head } from '@inertiajs/react';
import { BarChart3 } from 'lucide-react';
import { ResourceHeader } from '@/components/admin/resource-header';

// La ruta `analytics` es un closure (`inertia('admin/analytics')`) sin props: no hay datos que renderizar todavía.
export default function Index() {
    return (
        <>
            <Head title="Analytics" />
            <div className="space-y-6 p-6">
                <ResourceHeader title="Analytics" description="Traffic and sales reporting." icon={BarChart3} />
                <div className="flex flex-col items-center gap-2 rounded-lg border py-20 text-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-bold">No analytics data available yet</p>
                    <p className="text-xs text-muted-foreground">Provide a controller that passes metrics to this page.</p>
                </div>
            </div>
        </>
    );
}

Index.layout = { breadcrumbs: [{ title: 'Analytics', href: '/analytics' }] };