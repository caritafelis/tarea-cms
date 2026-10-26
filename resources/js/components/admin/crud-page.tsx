import { Head, router, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Search, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ConfirmDelete } from '@/components/admin/confirm-delete';
import { FormField, type CrudField } from '@/components/admin/form-fields';
import { ResourceHeader } from '@/components/admin/resource-header';
import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useCan } from '@/hooks/use-can';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { toDateTimeLocal } from '@/lib/format';

export type CrudForm = Record<string, any>;

export type FormApi = {
    data: CrudForm;
    setData: (key: string, value: any) => void;
    errors: Partial<Record<string, string>>;
};

export type CrudRoutes = {
    /** Solo necesarios en modo diálogo (sin `pages`). */
    store?: (team: string) => string;
    update?: (team: string, id: number) => string;
    destroy: (team: string, id: number) => string;
};

/** Modo páginas: create/edit/show navegan a páginas dedicadas en lugar de abrir el diálogo. */
export type CrudPages = {
    create: (team: string) => string;
    edit: (team: string, id: number) => string;
    show: (team: string, id: number) => string;
};

type Props<T extends { id: number }> = {
    title: string;
    singular: string;
    description: string;
    icon?: LucideIcon;
    /** Sufijo de permisos: create_<permission>, update_<permission>, delete_<permission>. */
    permission: string;
    items: T[];
    columns: ColumnDef<T, any>[];
    /** Solo necesarios en modo diálogo (sin `pages`). */
    fields?: CrudField[] | ((editing: T | null) => CrudField[]);
    defaults?: CrudForm;
    routes: CrudRoutes;
    pages?: CrudPages;
    itemName: (item: T) => string;
    /** Sobrescribe/añade valores al abrir el formulario de edición (se aplica sobre los campos hidratados). */
    toForm?: (item: T) => CrudForm;
    /** Transforma el payload justo antes de enviarlo. */
    transform?: (data: CrudForm) => CrudForm;
    renderFormExtra?: (api: FormApi, editing: T | null) => ReactNode;
    rowActions?: (item: T) => ReactNode;
    headerActions?: ReactNode;
    searchText?: (item: T) => string;
    pageSize?: number;
    dialogClassName?: string;
};

export function hydrate(item: any, fields: CrudField[], defaults: CrudForm): CrudForm {
    const out: CrudForm = { ...defaults };

    for (const f of fields) {
        const v = item[f.name];

        if (f.type === 'switch') out[f.name] = Boolean(v);
        else if (f.type === 'datetime-local') out[f.name] = toDateTimeLocal(v);
        else out[f.name] = v ?? defaults[f.name] ?? '';
    }

    return out;
}

export function CrudPage<T extends { id: number }>(p: Props<T>) {
    const team = useTeamSlug();
    const can = useCan();
    const canCreate = can(`create_${p.permission}`);
    const canUpdate = can(`update_${p.permission}`);
    const canDelete = can(`delete_${p.permission}`);

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<T | null>(null);
    const [pendingDelete, setPendingDelete] = useState<T | null>(null);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);

    const defaults = p.defaults ?? {};
    const form = useForm<CrudForm>(defaults);
    const fieldList = (typeof p.fields === 'function' ? p.fields(editing) : p.fields) ?? [];
    const pageSize = p.pageSize ?? 25;

    const openCreate = () => {
        if (p.pages) {
            router.visit(p.pages.create(team));

            return;
        }
        setEditing(null);
        form.clearErrors();
        form.setData({ ...defaults });
        setOpen(true);
    };

    const openEdit = (item: T) => {
        if (p.pages) {
            router.visit(p.pages.edit(team, item.id));

            return;
        }
        setEditing(item);
        form.clearErrors();
        form.setData({ ...hydrate(item, fieldList, defaults), ...(p.toForm?.(item) ?? {}) });
        setOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        form.transform((d) => (p.transform ? p.transform(d) : d));

        if (editing && p.routes.update) form.put(p.routes.update(team, editing.id), options);
        else if (!editing && p.routes.store) form.post(p.routes.store(team), options);
    };

    const confirmDelete = () => {
        if (!pendingDelete) return;
        router.delete(p.routes.destroy(team, pendingDelete.id), {
            preserveScroll: true,
            onFinish: () => setPendingDelete(null),
        });
    };

    const q = query.trim().toLowerCase();
    const filtered = q && p.searchText ? p.items.filter((i) => p.searchText!(i).toLowerCase().includes(q)) : p.items;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, pages - 1);
    const rows = filtered.slice(current * pageSize, (current + 1) * pageSize);

    const actionsColumn: ColumnDef<T, any> = {
        id: 'actions',
        header: '',
        meta: { className: 'w-10 text-right' },
        cell: ({ row }) => (
            <div className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-border/50 shadow-xl">
                        {p.pages && (
                            <DropdownMenuItem
                                className="text-[10px] font-bold uppercase tracking-widest"
                                onSelect={() => router.visit(p.pages!.show(team, row.original.id))}
                            >
                                View
                            </DropdownMenuItem>
                        )}
                        {p.rowActions?.(row.original)}
                        {canUpdate && (
                            <DropdownMenuItem
                                className="text-[10px] font-bold uppercase tracking-widest"
                                onSelect={() => openEdit(row.original)}
                            >
                                Edit
                            </DropdownMenuItem>
                        )}
                        {canDelete && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-[10px] font-bold uppercase tracking-widest text-destructive"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        setPendingDelete(row.original);
                                    }}
                                >
                                    Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ),
    };

    const columns = canUpdate || canDelete || p.rowActions || p.pages ? [...p.columns, actionsColumn] : p.columns;

    return (
        <>
            <Head title={p.title} />
            <div className="space-y-6 p-6">
                <ResourceHeader
                    title={p.title}
                    description={p.description}
                    icon={p.icon}
                    actions={p.headerActions}
                    onCreate={canCreate ? openCreate : undefined}
                    createLabel={`New ${p.singular}`}
                />

                {p.searchText && (
                    <div className="relative max-w-sm">
                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder={`Search ${p.title.toLowerCase()}…`}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setPage(0);
                            }}
                        />
                    </div>
                )}

                <DataTable
                    columns={columns}
                    data={rows}
                    emptyState={<p className="py-12 text-sm text-muted-foreground">No {p.title.toLowerCase()} found.</p>}
                />

                {pages > 1 && (
                    <div className="flex items-center justify-between rounded-lg border border-border px-5 py-4">
                        <p className="text-sm text-muted-foreground">
                            {filtered.length} total · page {current + 1} of {pages}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
                                Previous
                            </Button>
                            <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {!p.pages && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className={p.dialogClassName ?? 'sm:max-w-xl'}>
                        <form onSubmit={submit} className="flex max-h-[85vh] flex-col gap-4">
                            <DialogHeader>
                                <DialogTitle>{editing ? `Edit ${p.singular}` : `New ${p.singular}`}</DialogTitle>
                                <DialogDescription>{editing ? p.itemName(editing) : p.description}</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 overflow-y-auto px-0.5 py-0.5 sm:grid-cols-2">
                                {fieldList.map((f) => (
                                    <FormField
                                        key={f.name}
                                        field={f}
                                        value={form.data[f.name]}
                                        error={form.errors[f.name]}
                                        onChange={(v) => form.setData(f.name, v)}
                                    />
                                ))}
                                {p.renderFormExtra && (
                                    <div className="sm:col-span-2">
                                        {p.renderFormExtra(
                                            {
                                                data: form.data,
                                                setData: form.setData as FormApi['setData'],
                                                errors: form.errors as FormApi['errors'],
                                            },
                                            editing,
                                        )}
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? 'Saving…' : 'Save'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            <ConfirmDelete
                open={!!pendingDelete}
                title={`Delete ${pendingDelete ? p.itemName(pendingDelete) : ''}?`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
            />
        </>
    );
}