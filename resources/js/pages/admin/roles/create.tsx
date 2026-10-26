import { Head, useForm } from '@inertiajs/react';
import { Shield, Check, Info, Rocket } from 'lucide-react';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type Permission = { id: number; name: string };
type Props = { permissions: Permission[] };

export default function RoleCreate({ permissions }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        permissions: [] as string[],
    });

    const groupedPermissions = permissions.reduce((acc, p) => {
        const match = p.name.match(/^(view_any|view|create|update|delete|restore|force_delete)_(.+)$/);
        if (match) {
            const group = match[2].replace(/_/g, ' ').toUpperCase();
            if (!acc[group]) acc[group] = [];
            acc[group].push({ ...p, action: match[1] });
        } else {
            if (!acc['CUSTOM']) acc['CUSTOM'] = [];
            acc['CUSTOM'].push({ ...p, action: p.name });
        }
        return acc;
    }, {} as Record<string, any[]>);

    const togglePermission = (name: string) => {
        const current = [...data.permissions];
        const index = current.indexOf(name);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(name);
        }
        setData('permissions', current);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/system/roles');
    };

    return (
        <>
            <Head title="Define New Role" />
            <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-6 max-w-4xl mx-auto w-full">
                <PageHeader
                    title="Access Level Configuration"
                    description="Construct a new system role by aggregating specific granular permissions."
                />

                <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_280px]">
                    <div className="space-y-8">
                        <Card className="border-border bg-white shadow-xl overflow-hidden ring-1 ring-black/5">
                            <CardHeader className="p-6 border-b bg-muted/5 flex flex-row items-center gap-4">
                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100 shadow-sm">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Identity & Name</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Unique identifier for this role</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Role Label *</Label>
                                    <Input 
                                        id="name" 
                                        value={data.name} 
                                        onChange={e => setData('name', e.target.value)} 
                                        className="h-12 border-border shadow-sm focus-visible:ring-primary font-bold text-sm uppercase tracking-widest" 
                                        placeholder="E.G. PROJECT-MANAGER"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">Capability Matrix</h2>
                            
                            {Object.keys(groupedPermissions).length === 0 && (
                                <div className="text-xs text-muted-foreground italic pl-1">No permissions available. Please generate some in the Permissions module.</div>
                            )}

                            <div className="grid gap-6">
                                {Object.entries(groupedPermissions).map(([group, perms]) => (
                                    <div key={group} className="space-y-3">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border">
                                            {group} <span className="text-muted-foreground text-[9px] ml-2">({perms.length} Actions)</span>
                                        </h3>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {perms.map((p) => {
                                                const isSelected = data.permissions.includes(p.name);
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => togglePermission(p.name)}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                                                            isSelected 
                                                            ? 'bg-orange-50/50 border-orange-200 ring-1 ring-orange-500/20' 
                                                            : 'bg-white border-border hover:border-orange-100 hover:bg-muted/5'
                                                        }`}
                                                    >
                                                        <div className={`h-4 w-4 rounded-[4px] flex items-center justify-center transition-colors ${isSelected ? 'bg-orange-500 text-white' : 'border border-border bg-muted/20'}`}>
                                                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-orange-900' : 'text-muted-foreground'}`}>
                                                            {p.action.replace(/_/g, ' ')}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <Card className="border-border bg-white shadow-sm overflow-hidden sticky top-6">
                            <CardHeader className="p-5 border-b bg-muted/5">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Publication</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-70 flex items-center justify-between">
                                        Selected <span>{data.permissions.length} Units</span>
                                    </p>
                                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                        <div 
                                            className="h-full bg-orange-500 transition-all duration-500" 
                                            style={{ width: `${(data.permissions.length / permissions.length) * 100}%` }} 
                                        />
                                    </div>
                                </div>
                                <Separator className="opacity-50" />
                                <Button type="submit" className="w-full h-11 font-black text-[11px] uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20" disabled={processing}>
                                    {processing ? 'Constructing...' : 'Activate Role'}
                                </Button>
                                <Button type="button" variant="ghost" className="w-full h-9 font-black text-[10px] uppercase tracking-widest text-muted-foreground" onClick={() => history.back()}>
                                    Discard
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-2">
                                <Info className="h-3.5 w-3.5" /> Security Tip
                            </p>
                            <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                                Avoid over-privileged roles. Follow the principle of least privilege for a more secure environment.
                            </p>
                        </div>
                    </aside>
                </form>
            </div>
        </>
    );
}

RoleCreate.layout = {
    breadcrumbs: [
        { title: 'Security', href: '#' },
        { title: 'Roles', href: '/admin/system/roles' },
        { title: 'Constructor', href: '#' },
    ],
};
