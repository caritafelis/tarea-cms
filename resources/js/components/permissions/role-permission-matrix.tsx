import { Fragment, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    HugeiconsIcon,
    type IconSvgElement
} from '@hugeicons/react';
import {
    Archive01Icon,
    FileCodeCornerIcon,
    GlobalIcon,
    Image01Icon,
    Key01Icon,
    Layers01Icon,
    LockPasswordIcon,
    News01Icon,
    PackageIcon,
    PuzzleIcon,
    Settings01Icon,
    SecurityIcon,
    ShoppingCart01Icon,
    SparklesIcon,
    Tag01Icon,
    Ticket01Icon,
    UserGroupIcon,
    ArrowDown01Icon,
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import roles from '@/actions/App/Http/Controllers/Admin/RoleController';

type Permission = { id: number; name: string };
type Role = { id: number; name: string; permissions: Permission[] };

type Props = {
    roles: Role[];
    permissions: Permission[];
    teamSlug: string;
};

type GroupedPermission = Permission & { action: string };
type Group = { key: string; label: string; items: GroupedPermission[] };

const ACTION_PATTERN = /^(view_any|view|create|update|delete|restore|force_delete)_(.+)$/;

// Orden lógico de las acciones dentro de cada módulo (en vez del alfabético).
const ACTION_ORDER = ['view_any', 'view', 'create', 'update', 'delete', 'restore', 'force_delete'];

const MODULE_ICONS: Record<string, IconSvgElement> = {
    ai_insight: SparklesIcon,
    api_key: Key01Icon,
    backup: Archive01Icon,
    category: Tag01Icon,
    content_section: FileCodeCornerIcon,
    content_section_value: FileCodeCornerIcon,
    coupon: Ticket01Icon,
    cpt: Layers01Icon,
    cpt_definition: Layers01Icon,
    cpt_entry: Layers01Icon,
    media: Image01Icon,
    media_folder: Image01Icon,
    order: ShoppingCart01Icon,
    page: FileCodeCornerIcon,
    permission: LockPasswordIcon,
    plugin: PuzzleIcon,
    post: News01Icon,
    product: PackageIcon,
    role: SecurityIcon,
    setting: Settings01Icon,
    user: UserGroupIcon,
    language: GlobalIcon,
};

function moduleIcon(key: string): IconSvgElement {
    return MODULE_ICONS[key] ?? Key01Icon;
}

function humanize(slug: string) {
    const spaced = slug.replace(/_/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function actionRank(action: string) {
    const index = ACTION_ORDER.indexOf(action);
    return index === -1 ? ACTION_ORDER.length : index;
}

function groupPermissions(permissions: Permission[]): Group[] {
    const map = new Map<string, GroupedPermission[]>();
    for (const permission of permissions) {
        const match = permission.name.match(ACTION_PATTERN);
        const key = match ? match[2] : 'general';
        const action = match ? match[1] : permission.name;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ ...permission, action });
    }
    return Array.from(map.entries())
        .map(([key, items]) => ({
            key,
            label: humanize(key),
            items: items.sort((a, b) => actionRank(a.action) - actionRank(b.action)),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

export function RolePermissionMatrix({ roles: rolesData, permissions, teamSlug }: Props) {
    const [pending, setPending] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
    const [query, setQuery] = useState('');
    const groups = useMemo(() => groupPermissions(permissions), [permissions]);
    const granted = useMemo(() => {
        const map = new Map<number, Set<number>>();
        for (const role of rolesData) {
            map.set(role.id, new Set(role.permissions.map((p) => p.id)));
        }
        return map;
    }, [rolesData]);

    const visibleGroups = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? groups.filter((g) => g.label.toLowerCase().includes(q)) : groups;
    }, [groups, query]);

    if (rolesData.length === 0 || permissions.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border py-16 text-center">
                <HugeiconsIcon icon={Key01Icon} size={32} className="text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">Nothing to configure yet</p>
                <p className="text-sm text-muted-foreground">Create roles and permissions first.</p>
            </div>
        );
    }

    const toggleGroup = (key: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });

    const toggle = (role: Role, permission: Permission) => {
        const key = `${role.id}-${permission.id}`;
        setPending(key);
        router.patch(
            roles.togglePermission.url({ current_team: teamSlug, role: role.id, permission: permission.id }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ['roles'],
                onFinish: () => setPending((current) => (current === key ? null : current)),
            },
        );
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search modules"
                    aria-label="Search modules"
                    className="h-9 max-w-xs"
                />
                {expanded.size > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setExpanded(new Set())}>
                        Collapse all
                    </Button>
                )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="px-5 py-3 text-left font-medium text-muted-foreground">Actions</th>
                            {rolesData.map((role) => (
                                <th key={role.id} className="w-28 px-3 py-3 text-center font-medium capitalize text-muted-foreground">
                                    {role.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleGroups.length === 0 && (
                            <tr>
                                <td colSpan={rolesData.length + 1} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                    No modules match “{query}”.
                                </td>
                            </tr>
                        )}

                        {visibleGroups.map((group) => {
                            const open = expanded.has(group.key);

                            return (
                                <Fragment key={group.key}>
                                    {/* El click lo maneja el <tr>; el <button> solo aporta foco y teclado. */}
                                    <tr
                                        className="cursor-pointer border-b border-border bg-muted/40 transition-colors hover:bg-muted/60"
                                        onClick={() => toggleGroup(group.key)}
                                    >
                                        <td className="px-5 py-2.5">
                                            <button
                                                type="button"
                                                aria-expanded={open}
                                                className="flex w-full items-center gap-2 text-left text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                <HugeiconsIcon
                                                    icon={ArrowDown01Icon}
                                                    size={16}
                                                    className={cn('text-muted-foreground transition-transform duration-200', !open && '-rotate-90')}
                                                />
                                                <HugeiconsIcon icon={moduleIcon(group.key)} size={16} className="text-primary" />
                                                {group.label}
                                                <span className="text-xs font-normal text-muted-foreground">({group.items.length})</span>
                                            </button>
                                        </td>
                                        {rolesData.map((role) => {
                                            const set = granted.get(role.id);
                                            const count = group.items.reduce((n, item) => n + (set?.has(item.id) ? 1 : 0), 0);

                                            return (
                                                <td
                                                    key={role.id}
                                                    className="px-3 py-2.5 text-center text-xs tabular-nums text-muted-foreground"
                                                >
                                                    {count}/{group.items.length}
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {open &&
                                        group.items.map((permission) => (
                                            <tr key={permission.id} className="border-b border-border last:border-0">
                                                <td className="px-5 py-4 pl-10 text-foreground">{humanize(permission.action)}</td>
                                                {rolesData.map((role) => {
                                                    const key = `${role.id}-${permission.id}`;

                                                    return (
                                                        <td key={role.id} className="px-3 py-4 text-center">
                                                            <Checkbox
                                                                checked={granted.get(role.id)?.has(permission.id) ?? false}
                                                                disabled={pending === key}
                                                                onCheckedChange={() => toggle(role, permission)}
                                                                aria-label={`${humanize(permission.action)} · ${group.label} · ${role.name}`}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}