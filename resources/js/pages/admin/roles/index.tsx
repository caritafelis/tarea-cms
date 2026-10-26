import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import roles from '@/actions/App/Http/Controllers/Admin/RoleController';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, MoreHorizontalIcon, SecurityLockIcon, ShieldKeyIcon, UserGroupIcon } from '@hugeicons/core-free-icons';

type Permission = { id: number; name: string };
type Role = { id: number; name: string; permissions: Permission[]; users_count?: number };

type Props = { roles: Role[] };

export default function Index({ roles: rolesData }: Props) {
    const [pendingDelete, setPendingDelete] = useState<Role | null>(null);

    const { props } = usePage();
    const teamSlug = (props as any).currentTeam?.slug ?? 'default';

    const confirmDestroy = () => {
        if (!pendingDelete) return;

        router.delete(roles.destroy.url({ current_team: teamSlug, role: pendingDelete.id }), {
            preserveScroll: true,
            onFinish: () => setPendingDelete(null),
        });
    };

    const summary = useMemo(() => {
        const distinctPermissions = new Set(rolesData.flatMap((role) => role.permissions.map((p) => p.id))).size;
        const totalUsers = rolesData.reduce((sum, role) => sum + (role.users_count ?? 0), 0);
        return { distinctPermissions, totalUsers };
    }, [rolesData]);

    return (
        <>
            <Head title="Access Control - Roles" />
            <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-6 w-full">
                <PageHeader
                    title="Security Hierarchy"
                    description="Define system-wide roles and distribute permissions to regulate access."
                    action={{ label: 'Define New Role', href: roles.create.url() }}
                />

                {rolesData.length === 0 ? (
                    <Alert>
                        <HugeiconsIcon icon={SecurityLockIcon} />
                        <AlertTitle>No custom roles defined</AlertTitle>
                        <AlertDescription>
                            Start by defining access levels for your team.
                            <Button asChild variant="link" className="h-auto p-0 ml-1">
                                <Link href={roles.create.url()}>Initialize roles →</Link>
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{rolesData.length}</span> roles managing{' '}
                            <span className="font-medium text-foreground">{summary.distinctPermissions}</span> distinct permissions across{' '}
                            <span className="font-medium text-foreground">{summary.totalUsers}</span> users.
                        </p>

                        <TooltipProvider delayDuration={150}>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {rolesData.map((role, index) => {
                                    const visiblePermissions = role.permissions.slice(0, 5);
                                    const overflowPermissions = role.permissions.slice(5);

                                    return (
                                        <Card
                                            key={role.id}
                                            className="flex flex-col transition-all hover:border-primary/20 hover:shadow-md"
                                        >
                                            <CardHeader className="flex flex-row items-start justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                                                        <HugeiconsIcon icon={ShieldKeyIcon} className="h-5 w-5" />
                                                        <span className="absolute -bottom-1.5 -right-1.5 rounded-full border border-border bg-background px-1 font-mono text-[10px] leading-tight text-muted-foreground">
                                                            {String(index + 1).padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-base">{role.name}</CardTitle>
                                                        <CardDescription>System role level</CardDescription>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground">
                                                            <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={roles.edit.url({ current_team: teamSlug, role: role.id })}>
                                                                Edit Permissions
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onSelect={(e) => {
                                                                e.preventDefault();
                                                                setPendingDelete(role);
                                                            }}
                                                        >
                                                            Archive Role
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </CardHeader>

                                            <CardContent className="flex-1">
                                                {role.permissions.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {visiblePermissions.map((p) => (
                                                            <Badge key={p.id} variant="secondary">
                                                                {p.name}
                                                            </Badge>
                                                        ))}
                                                        {overflowPermissions.length > 0 && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge variant="outline" className="cursor-default">
                                                                        +{overflowPermissions.length} more
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-64">
                                                                    {overflowPermissions.map((p) => p.name).join(', ')}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground italic">No permissions assigned.</p>
                                                )}
                                            </CardContent>

                                            <Separator />

                                            <CardFooter className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <HugeiconsIcon icon={UserGroupIcon} className="h-3.5 w-3.5" />
                                                    {role.users_count ?? 0} {role.users_count === 1 ? 'user' : 'users'}
                                                </div>
                                                <Button
                                                    asChild
                                                    variant="link"
                                                    className="group h-auto p-0 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 hover:no-underline"
                                                >
                                                    <Link
                                                        href={roles.edit.url({ current_team: teamSlug, role: role.id })}
                                                        className="inline-flex items-center gap-1.5"
                                                    >
                                                        <span>Manage</span>
                                                        <HugeiconsIcon
                                                            icon={ArrowRight01Icon}
                                                            className="h-3.5 w-3.5 transition-transform duration-200 ease-in-out group-hover:translate-x-0.5"
                                                        />
                                                    </Link>
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        </TooltipProvider>
                    </div>
                )}
            </div>

            <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive {pendingDelete?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This might affect users currently assigned to this role. This action can be reversed later by an administrator.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDestroy}
                        >
                            Archive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: 'Security', href: '#' },
        { title: 'Roles', href: roles.index.url() },
    ],
};