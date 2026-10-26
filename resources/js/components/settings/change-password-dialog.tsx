import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSecurityBase } from '@/hooks/use-security-base';
import { cn } from '@/lib/utils';
import UpdatePasswordStep from './update-password-step';
import VerifyCodeStep from './verify-code-step';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Se llama cuando termina el flujo (flow="verify": al verificar el código; flow="password": al guardar). */
    onVerified?: () => void;
    /**
     * "verify": solo confirma identidad por correo (para activar 2FA, passkeys…).
     * "password": confirma identidad y luego pide la nueva contraseña.
     */
    flow?: 'verify' | 'password';
    title?: string;
    description?: string;
    passwordRules?: string;
}

export default function ChangePasswordDialog({
    open,
    onOpenChange,
    onVerified,
    flow = 'verify',
    title = 'Verify your identity',
    description = 'We emailed you a 6-digit code to confirm this change.',
    passwordRules = '',
}: Props) {
    const base = useSecurityBase();
    const [step, setStep] = useState<'verify' | 'update'>('verify');
    // Si se cierra a medias, se cancela la verificación en el servidor.
    const completed = useRef(false);

    useEffect(() => {
        if (open) {
            setStep('verify');
            completed.current = false;
        }
    }, [open]);

    function handleOpenChange(next: boolean) {
        if (!next && !completed.current) {
            axios.post(`${base}/password/cancel`).catch(() => undefined);
        }
        onOpenChange(next);
    }

    function handleVerified() {
        if (flow === 'verify') {
            completed.current = true;
            onVerified?.();
        } else {
            setStep('update');
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className={cn(step === 'update' ? 'sm:max-w-lg' : 'sm:max-w-md')}>
                {step === 'verify' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription>{description}</DialogDescription>
                        </DialogHeader>
                        <VerifyCodeStep onVerified={handleVerified} />
                    </>
                ) : (
                    <>
                        <DialogHeader className="sr-only">
                            <DialogTitle>Change password</DialogTitle>
                            <DialogDescription>Choose a new password.</DialogDescription>
                        </DialogHeader>
                        <UpdatePasswordStep
                            passwordRules={passwordRules}
                            onSuccess={() => {
                                completed.current = true;
                                onOpenChange(false);
                                onVerified?.();
                            }}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
