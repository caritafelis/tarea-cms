import { Head, useForm } from '@inertiajs/react';
import { Shield, Info } from 'lucide-react';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PermissionCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/system/permissions');
    };

    return (
        <>
            <Head title="Define New Permission" />
            <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-6 max-w-4xl mx-auto w-full">
                <PageHeader
                    title="Permission Configuration"
                    description="Construct a new system permission to represent a specific capability."
                />

                <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_280px]">
                    <div className="space-y-8">
                        <Card className="border-border bg-white shadow-xl overflow-hidden ring-1 ring-black/5">
                            <CardHeader className="p-6 border-b bg-muted/5 flex flex-row items-center gap-4">
                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Identity & Name</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Unique string key for this capability</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Permission Label *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="h-12 border-border shadow-sm focus-visible:ring-primary font-bold text-sm"
                                        placeholder="e.g. edit invoices, manage users"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="space-y-6">
                        <Card className="border-border bg-white shadow-sm overflow-hidden sticky top-6">
                            <CardHeader className="p-5 border-b bg-muted/5">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Publication</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <Button type="submit" className="w-full h-11 font-black text-[11px] uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20" disabled={processing}>
                                    {processing ? 'Constructing...' : 'Activate Permission'}
                                </Button>
                                <Button type="button" variant="ghost" className="w-full h-9 font-black text-[10px] uppercase tracking-widest text-muted-foreground" onClick={() => history.back()}>
                                    Discard
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-2">
                                <Info className="h-3.5 w-3.5" /> Dev Tip
                            </p>
                            <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                                Creating a permission here requires code logic like <code className="bg-blue-100/50 px-1 py-0.5 rounded border border-blue-200/50 font-mono text-[9px]">$user-&gt;can('...')</code> to actually enforce it.
                            </p>
                        </div>
                    </aside>
                </form>
            </div>
        </>
    );
}

PermissionCreate.layout = {
    breadcrumbs: [
        { title: 'Security', href: '#' },
        { title: 'Permissions', href: '/admin/system/permissions' },
        { title: 'Create', href: '#' },
    ],
};
