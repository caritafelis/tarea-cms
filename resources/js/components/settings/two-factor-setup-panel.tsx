import { Form } from '@inertiajs/react';
import { OTPInputContext, REGEXP_ONLY_DIGITS } from 'input-otp';
import { Check, Copy } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';
import AlertError from '@/components/alert-error';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { InputOTP } from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { useClipboard } from '@/hooks/use-clipboard';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { cn } from '@/lib/utils';
import { confirm } from '@/routes/two-factor';

const GUIDE = 'https://support.google.com/accounts/answer/1066447';

/** Casilla individual (como en la referencia): borde propio y "0" de placeholder. */
function OtpBox({ index }: { index: number }) {
    const { slots } = useContext(OTPInputContext);
    const { char, isActive, hasFakeCaret } = slots[index];

    return (
        <div
            className={cn(
                'relative flex size-10 items-center justify-center rounded-lg border border-input bg-background text-sm font-medium shadow-xs transition-all',
                isActive && 'z-10 border-ring ring-[3px] ring-ring/30',
            )}
        >
            {char ?? (hasFakeCaret ? null : <span className="text-muted-foreground/40">0</span>)}
            {hasFakeCaret && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
                </div>
            )}
        </div>
    );
}

function CodeInput({ processing, error }: { processing: boolean; error?: string }) {
    const [code, setCode] = useState('');
    const wrapper = useRef<HTMLDivElement>(null);

    // Tras un error el servidor limpia el formulario: limpiamos también las casillas.
    useEffect(() => {
        if (error) setCode('');
    }, [error]);

    return (
        <div ref={wrapper} className="space-y-2">
            <InputOTP
                id="otp"
                name="code"
                value={code}
                maxLength={OTP_MAX_LENGTH}
                onChange={setCode}
                // Al completar los 6 dígitos se envía solo, sin botón.
                onComplete={() => wrapper.current?.closest('form')?.requestSubmit()}
                disabled={processing}
                pattern={REGEXP_ONLY_DIGITS}
                autoFocus
            >
                <div className="flex gap-2">
                    {Array.from({ length: OTP_MAX_LENGTH }, (_, i) => (
                        <OtpBox key={i} index={i} />
                    ))}
                </div>
            </InputOTP>
            {processing && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Spinner className="size-3.5" /> Verifying…</p>}
            <InputError message={error} />
        </div>
    );
}

/**
 * Panel "Enable 2FA" en línea: QR a la izquierda; título, guía y 6 casillas a la derecha.
 */
export default function TwoFactorSetupPanel({
    qrCodeSvg,
    manualSetupKey,
    requiresConfirmation,
    twoFactorEnabled,
    fetchSetupData,
    errors,
    onClose,
    guideHref = GUIDE,
}: {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    requiresConfirmation: boolean;
    twoFactorEnabled: boolean;
    fetchSetupData: () => Promise<void>;
    errors: string[];
    onClose: () => void;
    guideHref?: string;
}) {
    const [copiedText, copy] = useClipboard();
    const fetchRef = useRef(fetchSetupData);
    fetchRef.current = fetchSetupData;

    useEffect(() => {
        if (!qrCodeSvg) void fetchRef.current();
        // Solo al montar: el panel se monta al activar 2FA.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const needsCode = requiresConfirmation && !twoFactorEnabled;

    return (
        <div className="rounded-xl border border-border bg-muted/30 p-5">
            {errors?.length ? (
                <AlertError errors={errors} />
            ) : (
                <div className="flex flex-col gap-5 sm:flex-row">
                    {/* El QR siempre va negro sobre blanco: es lo que escanean las apps. */}
                    <div className="size-28 shrink-0 self-start rounded-md bg-white p-1">
                        {qrCodeSvg ? (
                            <div className="[&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrCodeSvg }} />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center"><Spinner className="size-5" /></div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold">Enable 2FA</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Scan this QR code from an authenticator app such as Google Authenticator
                                    {needsCode ? ' and enter the 6-digit verification code.' : '.'}
                                </p>
                            </div>
                            <Button type="button" variant="outline" size="sm" asChild className="shrink-0">
                                <a href={guideHref} target="_blank" rel="noreferrer">View guide</a>
                            </Button>
                        </div>

                        <div className="mt-4">
                            {needsCode ? (
                                <Form {...confirm.form()} onSuccess={onClose} resetOnError resetOnSuccess>
                                    {({ processing, errors: formErrors }: { processing: boolean; errors?: { confirmTwoFactorAuthentication?: { code?: string } } }) => (
                                        <CodeInput processing={processing} error={formErrors?.confirmTwoFactorAuthentication?.code} />
                                    )}
                                </Form>
                            ) : (
                                <Button type="button" size="sm" onClick={onClose}>Done</Button>
                            )}
                        </div>

                        {manualSetupKey && (
                            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Can’t scan? Enter this key:</span>
                                <code className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{manualSetupKey}</code>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label="Copy setup key" onClick={() => copy(manualSetupKey)}>
                                    {copiedText === manualSetupKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}