import { router } from '@inertiajs/react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import ChangePasswordDialog from '@/components/settings/change-password-dialog';
import TwoFactorSetupPanel from '@/components/settings/two-factor-setup-panel';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import { Switch } from '@/components/ui/switch';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { disable, enable } from '@/routes/two-factor';

export type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function ManageTwoFactor(props: Props & { after?: ReactNode }) {
    const requiresConfirmation = props.requiresConfirmation ?? false;
    const twoFactorEnabled = props.twoFactorEnabled ?? false;

    const {
        qrCodeSvg, manualSetupKey, clearSetupData, clearTwoFactorAuthData,
        fetchSetupData, recoveryCodesList, fetchRecoveryCodes, errors,
    } = useTwoFactorAuth();

    const [verifyFor, setVerifyFor] = useState<'enable' | 'disable' | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const [busy, setBusy] = useState(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) clearTwoFactorAuthData();
        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    if (!(props.canManageTwoFactor ?? false)) return <>{props.after}</>;

    function closePanel() {
        setShowPanel(false);
        clearSetupData();
    }

    function run(action: 'enable' | 'disable') {
        setBusy(true);
        if (action === 'enable') {
            router.post(enable.url(), {}, {
                preserveScroll: true,
                onSuccess: () => setShowPanel(true),
                onFinish: () => setBusy(false),
            });
        } else {
            router.delete(disable.url(), {
                preserveScroll: true,
                onSuccess: closePanel,
                onFinish: () => setBusy(false),
            });
        }
    }

    function toggle(next: boolean) {
        if (next) return setVerifyFor('enable');
        // Cancelar una configuración a medias no requiere verificar de nuevo.
        if (showPanel && !twoFactorEnabled) return closePanel();
        setVerifyFor('disable');
    }

    return (
        <div className="space-y-4">
            <label className="flex w-fit cursor-pointer items-center gap-3 text-sm">
                <Switch checked={twoFactorEnabled || showPanel} disabled={busy} onCheckedChange={toggle} aria-label="Authenticator app" />
                Authenticator app
            </label>

            {props.after}

            {showPanel && (
                <div className="pt-2">
                    <TwoFactorSetupPanel
                        qrCodeSvg={qrCodeSvg}
                        manualSetupKey={manualSetupKey}
                        requiresConfirmation={requiresConfirmation}
                        twoFactorEnabled={twoFactorEnabled}
                        fetchSetupData={fetchSetupData}
                        errors={errors}
                        onClose={closePanel}
                    />
                </div>
            )}

            {twoFactorEnabled && !showPanel && (
                <TwoFactorRecoveryCodes recoveryCodesList={recoveryCodesList} fetchRecoveryCodes={fetchRecoveryCodes} errors={errors} />
            )}

            <ChangePasswordDialog
                open={verifyFor !== null}
                onOpenChange={(v) => !v && setVerifyFor(null)}
                title={verifyFor === 'disable' ? 'Confirm to turn off two-step verification' : 'Verify to turn on two-step verification'}
                onVerified={() => {
                    const action = verifyFor;
                    setVerifyFor(null);
                    if (action) requestAnimationFrame(() => run(action));
                }}
            />
        </div>
    );
}