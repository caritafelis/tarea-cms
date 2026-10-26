import { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    type ColumnDef,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    KeyRound,
    Lock,
    MoreHorizontal,
    Pencil,
    Search,
    Trash2,
} from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generate } from '@/routes/admin/permissions';
import { HugeiconsIcon } from '@hugeicons/react';
import { AccessIcon, ArrowUpDownIcon, Delete02Icon, Edit01Icon, EllipsisIcon } from '@hugeicons/core-free-icons';

type Permission = { id: number; name: string };

type Props = { permissions: Permission[]; models: string[] };

// Groups a permission by the resource it acts on, so a long flat list can be split into tabs.
// Adjust this if your naming convention isn't "resource.action" or "action resource".
function groupOf(name: string) {
    if (name.includes('.')) return name.split('.')[0];
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : 'general';
}

export default function PermissionIndex({ permissions, models }: Props) {
    const { props } = usePage();
    const teamSlug = (props as any).currentTeam?.slug ?? 'default';
    const { data, setData, post, processing } = useForm({
        model: '',
        clean: false,
    });

    const generateForModel = () => {
        if (!data.model) return;
        post(generate({ current_team: teamSlug }).url, {
            preserveScroll: true,
            onSuccess: () => setData((prev) => ({ ...prev, model: '' })),
        });
    };

    const destroy = (id: number) => {
        if (confirm('Delete this permission? Anything in the app that checks for it will stop working.')) {
            router.delete(`/admin/system/permissions/${id}`);
        }
    };

    const groups = useMemo(() => {
        const map = new Map<string, Permission[]>();
        for (const permission of permissions) {
            const key = groupOf(permission.name);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(permission);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [permissions]);

    return (
        <>
            <Head title="Access Control - Permissions" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8">
                <PageHeader
                    title="System permissions"
                    description="Define granular capabilities that can be assigned to system roles."
                    action={{ label: 'Create permission', href: '/admin/system/permissions/create' }}
                />

                {/* Auto-generate toolbar */}
                <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-foreground">Generate from a model</p>
                        <p className="text-sm text-muted-foreground">
                            Create the standard create/read/update/delete permissions for a model automatically.
                        </p>
                    </div>

                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                        {data.model === 'all' && (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="clean"
                                    checked={data.clean}
                                    onCheckedChange={(checked) => setData('clean', checked as boolean)}
                                />
                                <Label htmlFor="clean" className="cursor-pointer select-none text-sm text-muted-foreground">
                                    Remove orphaned permissions
                                </Label>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Select value={data.model} onValueChange={(val) => setData('model', val)}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All models</SelectItem>
                                    {models.map((model) => (
                                        <SelectItem key={model} value={model}>
                                            {model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button disabled={!data.model || processing} onClick={generateForModel}>
                                {processing ? 'Generating…' : data.model === 'all' ? 'Sync all' : 'Generate'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Permission table */}
                {permissions.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-20 text-center">
                        <Lock className="h-8 w-8 text-muted-foreground/40" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">No permissions defined</p>
                            <p className="text-sm text-muted-foreground">Start by defining a basic capability, like "edit articles".</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="mt-2">
                            <Link href="/admin/system/permissions/create">Add permission</Link>
                        </Button>
                    </div>
                ) : groups.length > 1 ? (
                    <Tabs defaultValue="all" className="gap-4">
                        <TabsList variant="line" className="w-full justify-start gap-5 overflow-x-auto">
                            <TabsTrigger value="all" className="gap-2 whitespace-nowrap px-0">
                                All
                                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                                    {permissions.length}
                                </span>
                            </TabsTrigger>
                            {groups.map(([key, items]) => (
                                <TabsTrigger key={key} value={key} className="gap-2 whitespace-nowrap px-0 capitalize">
                                    {key}
                                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                                        {items.length}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="all">
                            <PermissionsTable data={permissions} onDelete={destroy} />
                        </TabsContent>
                        {groups.map(([key, items]) => (
                            <TabsContent key={key} value={key}>
                                <PermissionsTable data={items} onDelete={destroy} />
                            </TabsContent>
                        ))}
                    </Tabs>
                ) : (
                    <PermissionsTable data={permissions} onDelete={destroy} />
                )}
            </div>
        </>
    );
}

function PermissionsTable({ data, onDelete }: { data: Permission[]; onDelete: (id: number) => void }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const columns = useMemo<ColumnDef<Permission>[]>(
        () => [
            {
                accessorKey: 'name',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="-ml-1 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Permission
                        <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-2 h-3.5 w-3.5" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={AccessIcon} className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm text-foreground">{row.original.name}</span>
                    </div>
                ),
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <HugeiconsIcon icon={EllipsisIcon} className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem asChild>
                                    <Link href={`/admin/system/permissions/${row.original.id}/edit`} className="cursor-pointer">
                                        <HugeiconsIcon icon={Edit01Icon} className="mr-2 h-3.5 w-3.5" />
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                    onClick={() => onDelete(row.original.id)}
                                >
                                    <HugeiconsIcon icon={Delete02Icon} className="mr-2 h-3.5 w-3.5" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        [onDelete],
    );

    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
        globalFilterFn: (row, _columnId, filterValue) =>
            row.original.name.toLowerCase().includes(String(filterValue).toLowerCase()),
    });

    return (
        <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between gap-4 border-b border-border p-4">
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Search permissions"
                        className="pl-8"
                    />
                </div>
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                    {table.getFilteredRowModel().rows.length} of {data.length}
                </span>
            </div>

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className={header.id === 'actions' ? 'w-12' : ''}>
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                                No permissions match your search.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between gap-4 border-t border-border p-4">
                <span className="text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

PermissionIndex.layout = {
    breadcrumbs: [
        { title: 'Security', href: '#' },
        { title: 'Permissions', href: '/admin/system/permissions' },
    ],
};