import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BadgeCheck, Loader2, Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';
import ImageUploadField from '@/components/image-upload-field';

type PageProps = { auth: Auth };
type Field = 'name' | 'email';

const linkBtn =
    'text-sm font-medium underline underline-offset-4 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm';

/** Fila: etiqueta | valor | acción, con separador punteado. */
function Row({
    title,
    description,
    action,
    children,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-3 border-b border-dotted border-border py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:gap-x-6">
            <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="min-w-0">{children}</div>
            <div className="flex items-start md:min-w-12 md:justify-end">{action}</div>
        </div>
    );
}

function initials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    const form = useForm<{ name: string; email: string; avatar: File | null }>({
        name: user.name, email: user.email, avatar: null,
    });
    const [editing, setEditing] = useState<Field | null>(null);
    const [resending, setResending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    const unverified = mustVerifyEmail && user.email_verified_at === null;
    const verified = mustVerifyEmail && user.email_verified_at !== null;

    function start(field: Field) {
        form.clearErrors();
        setEditing(field);
    }

    function cancel() {
        form.setData({ name: user.name, email: user.email });
        form.clearErrors();
        setEditing(null);
    }

    function save(e: React.FormEvent) {
        e.preventDefault();
        // El endpoint valida nombre y correo juntos, así que siempre se envían ambos.
        form.patch(ProfileController.update.url(), {
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults({ name: form.data.name, email: form.data.email });
                setEditing(null);
                toast.success('Profile updated.');
            },
        });
    }

    function resend() {
        setResending(true);
        router.post(send().url, {}, { preserveScroll: true, onFinish: () => setResending(false) });
    }

    /** Valor de texto o input en línea según el modo de edición. */
    function editable(field: Field, type: string, autoComplete: string, label: string) {
        if (editing !== field) {
            return <p className="truncate text-sm">{user[field]}</p>;
        }

        return (
            <form onSubmit={save} className="space-y-3">
                <Input
                    ref={inputRef}
                    aria-label={label}
                    type={type}
                    name={field}
                    value={form.data[field]}
                    onChange={(e) => form.setData(field, e.target.value)}
                    required
                    autoComplete={autoComplete}
                    onKeyDown={(e) => e.key === 'Escape' && cancel()}
                />
                <InputError message={form.errors[field]} />
                <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={form.processing || !form.isDirty} data-test="update-profile-button">
                        {form.processing ? (
                            <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving…
                            </>
                        ) : (
                            'Save'
                        )}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={cancel} disabled={form.processing}>
                        Cancel
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <>
            <Head title="Profile" />

            <div className="space-y-8 ">
                <header className="flex items-center gap-4">
                    {user.avatar ? (
                        <img src={user.avatar} alt="" className="size-14 rounded-xl border border-border object-cover" />
                    ) : (
                        <span
                            aria-hidden
                            className="flex size-14 items-center justify-center rounded-xl border border-border bg-muted text-lg font-semibold text-muted-foreground"
                        >
                            {initials(user.name)}
                        </span>
                    )}
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-semibold tracking-tight">Profile</h1>
                        <p className="text-sm text-muted-foreground">Manage your personal details.</p>
                    </div>
                </header>

                <section className="mt-10">
                    <h2 className="border-b border-dotted border-border pb-3 text-lg font-semibold">Details</h2>
                    <Row title="Avatar" description="PNG, JPG or WebP. Max 2 MB.">
                        <ImageUploadField
                            name="avatar"
                            label={user.name}
                            currentUrl={user.avatar_url}
                            onChange={(file) => { form.setData('avatar', file); if (file) setEditing('name'); }}
                        />
                    </Row>
                    <Row
                        title="Full name"
                        description="This will be displayed on your profile."
                        action={
                            editing !== 'name' && (
                                <button type="button" className={linkBtn} onClick={() => start('name')}>
                                    Edit
                                </button>
                            )
                        }
                    >
                        {editable('name', 'text', 'name', 'Full name')}
                    </Row>

                    <Row
                        title="Email address"
                        description="Used to sign in and receive notifications."
                        action={
                            editing !== 'email' && (
                                <button type="button" className={linkBtn} onClick={() => start('email')}>
                                    Edit
                                </button>
                            )
                        }
                    >
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="min-w-0 flex-1">{editable('email', 'email', 'username', 'Email address')}</div>
                                {verified && editing !== 'email' && (
                                    <BadgeCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Verified" />
                                )}
                            </div>

                            {unverified && editing !== 'email' && (
                                <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
                                    <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold">Please verify your email</p>
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            We sent a verification link to {user.email}. Open it to confirm your address.
                                        </p>
                                        {status === 'verification-link-sent' && (
                                            <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                A new verification link has been sent.
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={resend}
                                            disabled={resending}
                                            className="mt-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-60"
                                        >
                                            {resending ? 'Sending…' : 'Didn’t get the email?'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Row>
                </section>

                <DeleteUser />
            </div>
        </>
    );
}

Profile.layout = { breadcrumbs: [] };