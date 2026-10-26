import { Head, Link, router, usePage } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { DataTable } from '@/components/table/datatable';
import { columns, type UsersTableMeta } from '@/components/table/columns';
import { RolePermissionMatrix } from '@/components/permissions/role-permission-matrix';
import type { User, PaginatedData } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import users from '@/actions/App/Http/Controllers/Admin/UserController';

type Permission = { id: number; name: string };
type Role = { id: number; name: string; permissions: Permission[] };

type Props = {
    users: PaginatedData<User>;
    roles: Role[];
    permissions: Permission[];
};

export default function Index({ users: usersData, roles: rolesData, permissions }: Props) {
    const { hasPermission } = usePermissions();
    const [pendingDelete, setPendingDelete] = useState<User | null>(null);

    const { props } = usePage();
    const teamSlug = ((props as any).currentTeam?.slug) ?? 'default';

    const canUpdateUser = hasPermission('update_user');
    const canDeleteUser = hasPermission('delete_user');
    const canCreateUser = hasPermission('create_user');
    const canManageRoles = hasPermission('update_role');

    const confirmDestroy = () => {
        if (!pendingDelete) return;

        router.delete(users.destroy.url({ current_team: teamSlug, user: pendingDelete.id }), {
            preserveScroll: true,
            onFinish: () => setPendingDelete(null),
        });
    };

    const tableMeta: UsersTableMeta = {
        teamSlug,
        canUpdate: canUpdateUser,
        canDelete: canDeleteUser,
        onDeleteRequest: setPendingDelete,
    };

    return (
        <>
            <Head title="Users" />
            <div className="p-6 space-y-6">
                <PageHeader
                    title="Team Management"
                    description="Manage your team members and their account permissions here."
                    action={canCreateUser ? { label: 'Invite Member', href: users.create.url({ current_team: teamSlug }) } : undefined}
                />

                <Tabs defaultValue="users" className="gap-4">
                    <TabsList variant="line" className="gap-6">
                        <TabsTrigger value="users" className="gap-2 px-0">
                            All users
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                                {usersData.total}
                            </span>
                        </TabsTrigger>
                        {canManageRoles && (
                            <TabsTrigger value="roles" className="px-0">
                                User role manager
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="users" className="space-y-6">
                        <DataTable
                            columns={columns}
                            data={usersData.data}
                            meta={tableMeta}
                            emptyState={
                                <div className="flex flex-col items-center gap-2 py-16 text-center">
                                    <Users className="h-8 w-8 text-muted-foreground/30" />
                                    <p className="text-sm font-bold text-foreground">No users found</p>
                                </div>
                            }
                        />

                        {usersData.last_page > 1 && (
                            <div className="flex items-center justify-between rounded-lg border border-border px-5 py-4">
                                <p className="text-sm text-muted-foreground">{usersData.total} total members</p>
                                <div className="flex gap-2">
                                    <Button asChild variant="outline" size="sm" disabled={!usersData.prev_page_url}>
                                        <Link href={usersData.prev_page_url ?? '#'}>Previous</Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm" disabled={!usersData.next_page_url}>
                                        <Link href={usersData.next_page_url ?? '#'}>Next</Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {canManageRoles && (
                        <TabsContent value="roles">
                            <RolePermissionMatrix roles={rolesData} permissions={permissions} teamSlug={teamSlug} />
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive {pendingDelete?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove their access to the team. This action can be reversed later by an administrator.
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

Index.layout = { breadcrumbs: [{ title: 'Users', href: users.index.url() }] };