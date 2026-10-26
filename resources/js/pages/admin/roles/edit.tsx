import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Info, Save, Shield } from 'lucide-react';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import roles from '@/actions/App/Http/Controllers/Admin/RoleController';

type Permission = { id: number; name: string };
type Role = { id: number; name: string; permissions: Permission[] };
type ActionPermission = Permission & { action: string };

type Props = {
    role: Role;
    permissions: Permission[];
};

export default function Edit({ role, permissions }: Props) {
    const { props } = usePage();
    const teamSlug = (props as any).currentTeam?.slug ?? 'default';

    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        permissions: role.permissions.map((p) => p.name),
    });

    const groupedPermissions = permissions.reduce<Record<string, ActionPermission[]>>((acc, p) => {
        const match = p.name.match(/^(view_any|view|create|update|delete|restore|force_delete)_(.+)$/);
        if (match) {
            const group = match[2].replace(/_/g, ' ').toUpperCase();
            (acc[group] ??= []).push({ ...p, action: match[1] });
        } else {
            (acc['CUSTOM'] ??= []).push({ ...p, action: p.name });
        }
        return acc;
    }, {});

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

    const toggleGroupAll = (perms: { name: string }[]) => {
        const names = perms.map((p) => p.name);
        const allSelected = names.every((name) => data.permissions.includes(name));
        setData(
            'permissions',
            allSelected
                ? data.permissions.filter((name) => !names.includes(name))
                : [...new Set([...data.permissions, ...names])],
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(roles.update.url({ current_team: teamSlug, role: role.id }));
    };

    const progress = permissions.length > 0 ? (data.permissions.length / permissions.length) * 100 : 0;

    return (
        <>
            <Head title={`Edit Role: ${role.name}`} />
            <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-6 w-full">
                <PageHeader
                    title="Access Level Modification"
                    description={`Updating the capability matrix for the "${role.name}" role`}
                />

                <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_300px]">
                    <div className="space-y-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle>Identity & Name</CardTitle>
                                    <CardDescription>Role identifier in the security system</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Role Label</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. project-manager"
                                        aria-invalid={!!errors.name}
                                    />
                                    <InputError message={errors.name} />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <div>
                                <h2 className="text-base font-semibold">Capability Matrix</h2>
                                <p className="text-sm text-muted-foreground">Select which actions this role is allowed to perform</p>
                            </div>

                            {Object.keys(groupedPermissions).length === 0 ? (
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>No permissions available</AlertTitle>
                                    <AlertDescription>
                                        Generate some permissions in the Permissions module before assigning them to a role.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(groupedPermissions).map(([group, perms]) => {
                                        const selectedCount = perms.filter((p) => data.permissions.includes(p.name)).length;
                                        const allSelected = selectedCount === perms.length;
                                        return (
                                            <Card key={group} className="overflow-hidden py-0">
                                                <Accordion type="single" collapsible defaultValue={group}>
                                                    <AccordionItem value={group} className="border-none">
                                                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                                                            <div className="flex w-full items-center justify-between pr-2">
                                                                <span className="text-sm font-semibold">{group}</span>
                                                                <span
                                                                    className={
                                                                        allSelected
                                                                            ? 'flex items-center gap-1 text-xs font-medium text-primary'
                                                                            : 'text-xs text-muted-foreground'
                                                                    }
                                                                >
                                                                    {allSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                                    {selectedCount}/{perms.length}
                                                                </span>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="px-5 pb-5 pt-0">
                                                            <div className="mb-3 flex items-center justify-end">
                                                                <Button
                                                                    type="button"
                                                                    variant="link"
                                                                    className="h-auto p-0 text-xs font-medium"
                                                                    onClick={() => toggleGroupAll(perms)}
                                                                >
                                                                    {allSelected ? 'Deselect all' : 'Select all'}
                                                                </Button>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-y-3">
                                                                {perms.map((p) => {
                                                                    const checked = data.permissions.includes(p.name);
                                                                    return (
                                                                        <div key={p.id} className="flex items-center gap-2">
                                                                            <Checkbox
                                                                                id={`perm-${p.id}`}
                                                                                checked={checked}
                                                                                onCheckedChange={() => togglePermission(p.name)}
                                                                            />
                                                                            <Label
                                                                                htmlFor={`perm-${p.id}`}
                                                                                className="cursor-pointer text-sm font-normal capitalize"
                                                                            >
                                                                                {p.action.replace(/_/g, ' ')}
                                                                            </Label>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                            <InputError message={errors.permissions} />
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <Card className="sticky top-6">
                            <CardHeader>
                                <CardTitle>Persist Changes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Assigned</span>
                                        <span>
                                            {data.permissions.length} / {permissions.length}
                                        </span>
                                    </div>
                                    <Progress value={progress} />
                                </div>
                                <Separator />
                                <Button type="submit" className="w-full" disabled={processing}>
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Synchronizing…' : 'Save Configuration'}
                                </Button>
                                <Button type="button" variant="ghost" className="w-full" onClick={() => window.history.back()}>
                                    Discard
                                </Button>
                            </CardContent>
                        </Card>

                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Note</AlertTitle>
                            <AlertDescription>
                                Changes to roles are applied instantly to all users assigned to this level.
                            </AlertDescription>
                        </Alert>
                    </aside>
                </form>
            </div>
        </>
    );
}

Edit.layout = {
    breadcrumbs: [
        { title: 'Security', href: '#' },
        { title: 'Roles', href: roles.index.url() },
        { title: 'Editor', href: '#' },
    ],
};