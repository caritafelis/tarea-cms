import { Head, useForm } from '@inertiajs/react';
import { Users, Shield, Key, Mail, User, UserCog, UserPlus } from 'lucide-react';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import users from '@/actions/App/Http/Controllers/Admin/UserController';

type Role = { id: number; name: string };

type Props = {
    roles: Role[];
};

export default function UsersCreate({ roles = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as string[],
    });

    const toggleRole = (roleName: string) => {
        const current = [...data.roles];
        const index = current.indexOf(roleName);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(roleName);
        }
        setData('roles', current);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(users.store.url());
    };

    return (
        <>
            <Head title="Create User" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
                <PageHeader
                    title="Add Team Member"
                    description="Invite a new user and define their system-wide access levels."
                    icon={Users}
                />

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-primary/5 shadow-inner">
                                <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle>Security & Identity</CardTitle>
                                <CardDescription>Core credentials for the new account</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name" className="flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                                        Full Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Alexander Graham"
                                        aria-invalid={!!errors.name}
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="email" className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                        Work Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="alex@company.com"
                                        aria-invalid={!!errors.email}
                                    />
                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="password" className="flex items-center gap-1.5">
                                        <Key className="h-3.5 w-3.5 text-muted-foreground" />
                                        Password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        aria-invalid={!!errors.password}
                                    />
                                    <InputError message={errors.password} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="password_confirmation" className="flex items-center gap-1.5">
                                        <Key className="h-3.5 w-3.5 text-muted-foreground" />
                                        Confirm Password
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        autoComplete="new-password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        aria-invalid={!!errors.password_confirmation}
                                    />
                                    <InputError message={errors.password_confirmation} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-orange-50 shadow-inner dark:bg-orange-950/40">
                                <UserCog className="h-4 w-4 text-orange-600" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle>System Roles</CardTitle>
                                <CardDescription>Choose which roles this account holds</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {roles.length === 0 ? (
                                <Alert>
                                    <UserCog className="h-4 w-4" />
                                    <AlertTitle>No roles available</AlertTitle>
                                    <AlertDescription>
                                        There are no roles configured yet, so none can be assigned to this user.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {roles.map((role) => {
                                        const checked = data.roles.includes(role.name);
                                        return (
                                            <Label
                                                key={role.id}
                                                htmlFor={`role-${role.id}`}
                                                className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer select-none has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                                            >
                                                <Checkbox
                                                    id={`role-${role.id}`}
                                                    checked={checked}
                                                    onCheckedChange={() => toggleRole(role.name)}
                                                    className="mt-0.5"
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <Badge variant={checked ? 'default' : 'secondary'} className="w-fit">
                                                        {role.name}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">
                                                        System level access for {role.name}.
                                                    </p>
                                                </div>
                                            </Label>
                                        );
                                    })}
                                </div>
                            )}
                            <InputError message={errors.roles} className="mt-3" />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => history.back()}>
                            Discard
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <UserPlus className="h-4 w-4" />
                            {processing ? 'Creating…' : 'Finalize Creation'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

UsersCreate.layout = {
    breadcrumbs: [
        { title: 'Staff', href: users.index.url() },
        { title: 'Invite User', href: users.create.url() },
    ],
};