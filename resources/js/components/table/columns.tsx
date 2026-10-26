import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/types';
import users from '@/actions/App/Http/Controllers/Admin/UserController';

// Extra table-level callbacks/state, passed in via the `meta` prop of useReactTable.
export interface UsersTableMeta {
    teamSlug: string;
    canUpdate: boolean;
    canDelete: boolean;
    onDeleteRequest: (user: User) => void;
}

export const columns: ColumnDef<User, unknown>[] = [

    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row, table }) => {
            const user = row.original;
            const meta = table.options.meta as UsersTableMeta;
            const teamSlug = meta?.teamSlug ?? 'default';

            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border-2 border-white shadow-sm ring-1 ring-border/50">
                        <AvatarImage src={user.avatar ?? ''} />
                        <AvatarFallback className="bg-orange-50 text-orange-600 text-[10px] font-black uppercase">
                            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    {/* 3. Corregimos la llamada pasando el objeto con current_team y user */}
                    <Link
                        href={users.edit.url({ current_team: teamSlug, user: user.id })}
                        className="font-bold text-foreground hover:text-primary transition-colors"
                    >
                        {user.name}
                    </Link>
                </div>
            );
        },
    },
    {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span className="text-xs font-semibold text-muted-foreground">{row.original.email}</span>,
        meta: { className: 'hidden md:table-cell' },
    },
    {
        accessorKey: 'created_at',
        header: 'Date Added',
        cell: ({ row }) => {
            const date = new Date(row.original.created_at);
            return (
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                    {date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' - '}
                    {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                </div>
            );
        },
        meta: { className: 'hidden lg:table-cell' },
    },
    {
        id: 'role',
        header: 'Role',
        cell: () => (
            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">
                Admin
            </Badge>
        ),
        meta: { className: 'hidden md:table-cell' },
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row, table }) => {
            const user = row.original;
            const meta = table.options.meta as UsersTableMeta;
            const teamSlug = meta?.teamSlug ?? 'default';

            if (!meta?.canUpdate && !meta?.canDelete) return null;

            return (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-brand-purple/5">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border/50 shadow-xl backdrop-blur-xl">
                            {meta.canUpdate && (
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={users.edit.url({ current_team: teamSlug, user: user.id })}
                                        className="text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        Edit Details
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            {meta.canDelete && (
                                <>
                                    <DropdownMenuSeparator className="bg-border/30" />
                                    <DropdownMenuItem
                                        className="text-destructive font-bold text-[10px] uppercase tracking-widest"
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            meta.onDeleteRequest(user);
                                        }}
                                    >
                                        Archive
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
        meta: { className: 'text-right' },
    },
];