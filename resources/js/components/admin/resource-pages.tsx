import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { EnabledBadge, Muted } from '@/components/admin/cells';
import { hydrate, type FormApi } from '@/components/admin/crud-page';
import { FormField, type CrudField } from '@/components/admin/form-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCan } from '@/hooks/use-can';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { formatDate } from '@/lib/format';
import { resources, urls } from './resources';

type Props = { slug: string } & Record<string, any>;

function Header({ title, subtitle, back, children }: { title: string; subtitle?: string; back: string; children?: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <Button asChild variant="outline" size="icon">
                    <Link href={back}><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
                </div>
            </div>
            <div className="flex gap-2">{children}</div>
        </div>
    );
}

export function ResourceForm({ slug, ...props }: Props) {
    const cfg = resources[slug];
    const team = useTeamSlug();
    const u = urls(slug, team);
    const model = props[cfg.prop] ?? null;
    const fields = cfg.fields(props, model);
    const form = useForm<Record<string, any>>(
        model ? { ...hydrate(model, fields, cfg.defaults), ...(cfg.toForm?.(model) ?? {}) } : { ...cfg.defaults },
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((d) => (cfg.transform ? cfg.transform(d) : d));
        if (model) form.put(u.update(model.id));
        else form.post(u.store());
    };

    const title = model ? `Edit ${cfg.singular}` : `New ${cfg.singular}`;

    return (
        <>
            <Head title={title} />
            <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 p-6">
                <Header title={title} subtitle={model ? cfg.itemName(model) : undefined} back={u.index()}>
                    <Button asChild variant="outline"><Link href={u.index()}>Cancel</Link></Button>
                    <Button type="submit" disabled={form.processing}>{form.processing ? 'Saving…' : 'Save'}</Button>
                </Header>
                <Card>
                    <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                        {fields.map((f) => (
                            <FormField
                                key={f.name}
                                field={f}
                                value={form.data[f.name]}
                                error={(form.errors as Record<string, string | undefined>)[f.name]}
                                onChange={(v) => form.setData(f.name, v)}
                            />
                        ))}
                    </CardContent>
                </Card>
                {cfg.extra?.(
                    {
                        data: form.data,
                        setData: form.setData as FormApi['setData'],
                        errors: form.errors as FormApi['errors'],
                    },
                    model,
                )}
            </form>
            {cfg.outside && <div className="mx-auto max-w-3xl p-6 pt-0">{cfg.outside(props, model)}</div>}
        </>
    );
}

const render = (f: CrudField, v: any) => {
    if (f.type === 'switch') return <EnabledBadge enabled={Boolean(v)} />;
    if (v == null || v === '') return <Muted>—</Muted>;
    if (Array.isArray(v)) return v.join(', ');
    if (f.type === 'datetime-local') return formatDate(v, true);
    if (f.type === 'select') return f.options?.find((o) => String(o.value) === String(v))?.label ?? String(v);

    return String(v);
};

export function ResourceShow({ slug, ...props }: Props) {
    const cfg = resources[slug];
    const team = useTeamSlug();
    const can = useCan();
    const u = urls(slug, team);
    const model = props[cfg.prop];
    const fields = cfg.fields(props, model);

    return (
        <>
            <Head title={cfg.itemName(model)} />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <Header title={cfg.itemName(model)} subtitle={cfg.singular} back={u.index()}>
                    {can(`update_${cfg.permission}`) && (
                        <Button asChild><Link href={u.edit(model.id)}>Edit</Link></Button>
                    )}
                </Header>

                {cfg.stats && (
                    <div className="grid gap-4 sm:grid-cols-3">
                        {cfg.stats(model).map(([label, value]) => (
                            <Card key={label}>
                                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase text-muted-foreground">{label}</CardTitle></CardHeader>
                                <CardContent className="text-2xl font-bold">{value}</CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Card>
                    <CardContent className="pt-6">
                        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                            {fields.map((f) => (
                                <div key={f.name} className={f.span === 2 ? 'sm:col-span-2' : undefined}>
                                    <dt className="text-xs font-semibold uppercase text-muted-foreground">{f.label}</dt>
                                    <dd className="mt-1 whitespace-pre-line text-sm">{render(f, model[f.name])}</dd>
                                </div>
                            ))}
                        </dl>
                    </CardContent>
                </Card>

                {cfg.showExtra && (
                    <Card>
                        <CardContent className="pt-6">{cfg.showExtra(model)}</CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}