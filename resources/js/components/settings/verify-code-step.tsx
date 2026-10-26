import axios from 'axios';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useSecurityBase } from '@/hooks/use-security-base';

const COOLDOWN = 30;

const messageFrom = (error: unknown, fallback: string) =>
    axios.isAxiosError(error) ? ((error.response?.data as { message?: string })?.message ?? fallback) : fallback;

/** Pide el código por correo y lo verifica. Autoverifica al completar los 6 dígitos. */
export default function VerifyCodeStep({ onVerified }: { onVerified: () => void }) {
    const base = useSecurityBase();
    const [value, setValue] = useState('');
    const [sending, setSending] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const sentRef = useRef(false);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const sendCode = useCallback(async () => {
        try {
            setSending(true);
            setError(null);
            await axios.post(`${base}/password/send-code`);
            setCooldown(COOLDOWN);
        } catch (e) {
            if (axios.isAxiosError(e) && e.response?.status === 429) setCooldown(COOLDOWN);
            setError(messageFrom(e, 'We couldn’t send the code. Try again.'));
        } finally {
            setSending(false);
        }
    }, [base]);

    useEffect(() => {
        if (sentRef.current) return;
        sentRef.current = true;
        void sendCode();
    }, [sendCode]);

    async function verify(code: string) {
        try {
            setProcessing(true);
            setError(null);
            await axios.post(`${base}/password/verify-code`, { code });
            onVerified();
        } catch (e) {
            setError(messageFrom(e, 'That code didn’t work. Try again.'));
            setValue('');
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="flex w-full flex-col items-center space-y-4">
            <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={value}
                disabled={processing}
                autoFocus
                onChange={(v) => {
                    setValue(v);
                    if (v.length === 6) void verify(v);
                }}
            >
                <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
            </InputOTP>

            {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}

            <div className="flex w-full justify-end gap-2">
                <Button type="button" variant="secondary" onClick={sendCode} disabled={sending || cooldown > 0}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </Button>
                <Button type="button" onClick={() => verify(value)} disabled={value.length !== 6 || processing || sending}>
                    {processing ? 'Verifying…' : 'Verify code'}
                </Button>
            </div>
        </div>
    );
}
