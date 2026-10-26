import { Head } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import ManagePasskeys, { type Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManageTwoFactor, { type Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import BrowserSessions, { type BrowserSession } from '@/components/settings/browser-sessions';
import ChangePasswordDialog from '@/components/settings/change-password-dialog';
import { SecurityRow, SecuritySection } from '@/components/settings/security-ui';
import { Button } from '@/components/ui/button';

type Props = {
    passwordRules: string;
    /** Opcional: fecha ISO del último cambio de contraseña. */
    passwordUpdatedAt?: string | null;
    sessions?: BrowserSession[];
} & ManagePasskeysProps &
    ManageTwoFactorProps;

const DISMISS_KEY = 'security-banner-dismissed';

/** Puntaje simple según las protecciones activas. */
function useSecurityScore(props: Props) {
    const checks = [
        { done: true, hint: '', target: 'basics' },
        ...(props.canManageTwoFactor
            ? [{ done: !!props.twoFactorEnabled, hint: 'Turn on two-step verification to protect sign in.', target: 'two-step' }]
            : []),
        ...(props.canManagePasskeys
            ? [{ done: (props.passkeys?.length ?? 0) > 0, hint: 'Add a passkey for faster, phishing-resistant sign in.', target: 'two-step' }]
            : []),
    ];
    const pending = checks.find((c) => !c.done);

    return {
        score: Math.round((checks.filter((c) => c.done).length / checks.length) * 100),
        hint: pending?.hint,
        target: pending?.target ?? 'basics',
        show: checks.length > 1,
    };
}

function readDismissed(): number | null {
    try {
        const v = typeof window !== 'undefined' ? window.localStorage.getItem(DISMISS_KEY) : null;
        return v === null ? null : Number(v);
    } catch {
        return null;
    }
}

export default function Security(props: Props) {
    const [changePassword, setChangePassword] = useState(false);
    const [dismissedAt, setDismissedAt] = useState<number | null>(readDismissed);
    const { score, hint, target, show } = useSecurityScore(props);

    // Se oculta solo para el puntaje actual: si cambia, el aviso vuelve.
    const showBanner = show && dismissedAt !== score;

    function dismiss() {
        setDismissedAt(score);
        try {
            window.localStorage.setItem(DISMISS_KEY, String(score));
        } catch {
            /* sin storage: solo dura la visita */
        }
    }

    function review() {
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const updated = props.passwordUpdatedAt
        ? new Date(props.passwordUpdatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    const hasTwoStep = !!(props.canManageTwoFactor || props.canManagePasskeys);
    const passkeys = <ManagePasskeys canManagePasskeys={props.canManagePasskeys} passkeys={props.passkeys} />;

    return (
        <>
            <Head title="Security" />

            <div className="space-y-8 ">
                <h1 className="text-2xl font-semibold tracking-tight">Security</h1>

                {showBanner && (
                    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                            <Lock className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold">Your account security is {score}%</p>
                                <p className="text-sm text-muted-foreground">
                                    {hint ?? 'Please review your account security settings regularly and update your password.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={dismiss}>Dismiss</Button>
                            <Button type="button" size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={review}>
                                Review security
                            </Button>
                        </div>
                    </div>
                )}

                <SecuritySection id="basics" title="Basics">
                    <div className="border-b border-dotted border-border">
                        <SecurityRow
                            title="Password"
                            description={updated ? `Last updated ${updated}.` : 'We’ll email you a code to confirm it’s you before you change it.'}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <span aria-hidden className="select-none text-base leading-none tracking-[0.18em]">••••••••••••••••••••</span>
                                <Button type="button" size="sm" variant="outline" onClick={() => setChangePassword(true)}>
                                    Edit
                                </Button>
                            </div>
                        </SecurityRow>

                        {hasTwoStep && (
                            <SecurityRow
                                id="two-step"
                                title="Two-step verification"
                                description="We recommend requiring a verification code in addition to your password."
                            >
                                <ManageTwoFactor
                                    canManageTwoFactor={props.canManageTwoFactor}
                                    requiresConfirmation={props.requiresConfirmation}
                                    twoFactorEnabled={props.twoFactorEnabled}
                                    after={passkeys}
                                />
                            </SecurityRow>
                        )}
                    </div>
                </SecuritySection>

                <BrowserSessions sessions={props.sessions} />
            </div>

            <ChangePasswordDialog
                open={changePassword}
                onOpenChange={setChangePassword}
                flow="password"
                passwordRules={props.passwordRules}
                title="Verify to change your password"
            />
        </>
    );
}

Security.layout = { breadcrumbs: [] };