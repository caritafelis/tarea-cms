import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { create, index } from '@/routes/teams';

export default function TeamsCreate({ plan, marketingUrl }: { plan: string; marketingUrl: string }) {
    const form = useForm<{ name: string; organization_type: string; billing_address: string; tax_id: string; icon: File | null }>({
        name: '', organization_type: 'company', billing_address: '', tax_id: '', icon: null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/teams', { forceFormData: true }); // ajusta si tu ruta teams.store difiere
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title="Create organization" />
            <div className="flex gap-3 p-8">
                <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={() => router.visit('/')}><X className="size-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={() => window.history.back()}><ArrowLeft className="size-4" /></Button>
            </div>

            <form onSubmit={submit} className="mx-auto mt-6 w-full max-w-xl space-y-6 rounded-2xl border bg-card p-8">
                <header>
                    <h1 className="text-2xl font-semibold">Create organization</h1>
                    <p className="text-muted-foreground">Provide your organization details.</p>
                </header>

                <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
                    <span className="font-medium">{plan} Plan</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => (window.location.href = `${marketingUrl}/pricing`)}>Change</Button>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-end gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Organization name</Label>
                        <Input id="name" placeholder="Enter name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        {form.errors.name && <p className="text-sm text-red-500">{form.errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <label className="flex h-9 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm">
                            {form.data.icon ? form.data.icon.name : 'Upload'}
                            <span className="text-xs text-muted-foreground">2MB PNG or JPG</span>
                            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => form.setData('icon', e.target.files?.[0] ?? null)} />
                        </label>
                        {form.errors.icon && <p className="text-sm text-red-500">{form.errors.icon}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="type">Organization type</Label>
                    <select
                        id="type"
                        value={form.data.organization_type}
                        onChange={(e) => form.setData('organization_type', e.target.value)}
                        className="h-10 w-full rounded-md border bg-transparent px-3 text-sm"
                    >
                        <option value="company">Company</option>
                        <option value="individual">Individual</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between"><Label htmlFor="addr">Billing address</Label><span className="text-xs text-muted-foreground">Optional</span></div>
                    <Input id="addr" placeholder="Enter business address" value={form.data.billing_address} onChange={(e) => form.setData('billing_address', e.target.value)} />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between"><Label htmlFor="tax">Tax identification number</Label><span className="text-xs text-muted-foreground">Optional</span></div>
                    <Input id="tax" placeholder="Enter your tax number" value={form.data.tax_id} onChange={(e) => form.setData('tax_id', e.target.value)} />
                </div>

                <Button type="submit" className="h-11 w-full" disabled={form.processing}>Create organization</Button>
            </form>
        </div>
    );
}

TeamsCreate.layout = (props: { team: { name: string; slug: string } }) => ({
    breadcrumbs: [
        {
            title: 'Teams',
            href: index(),
        },
        {
            title: props.team.name,
            href: '/settings/teams',
        },
    ],
});