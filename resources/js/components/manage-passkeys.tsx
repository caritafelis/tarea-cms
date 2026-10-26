import { router } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import PasskeyItem from '@/components/passkey-item';
import PasskeyRegistration from '@/components/passkey-register';
import ChangePasswordDialog from '@/components/settings/change-password-dialog';
import { Button } from '@/components/ui/button';
import type { Passkey } from '@/types/auth';

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

export default function ManagePasskeys(props: Props) {
    const [openVerify, setOpenVerify] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);
    const passkeys = props.passkeys ?? [];

    if (!(props.canManagePasskeys ?? false)) return null;

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(destroy.url(id), { preserveScroll: true, onError });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
                <span className="flex w-9 justify-center"><KeyRound className="h-4 w-4 text-muted-foreground" /></span>
                <span>Passkeys</span>
                <span className="text-muted-foreground">{passkeys.length > 0 ? `(${passkeys.length})` : 'None yet'}</span>
                <Button type="button" size="sm" variant="outline" className="ml-auto" onClick={() => setOpenVerify(true)}>Add passkey</Button>
            </div>

            {passkeys.length > 0 && (
                <div className="space-y-2">
                    {passkeys.map((passkey) => (
                        <PasskeyItem key={passkey.id} passkey={passkey} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            <ChangePasswordDialog
                open={openVerify}
                onOpenChange={setOpenVerify}
                title="Verify to add a passkey"
                onVerified={() => {
                    setOpenVerify(false);
                    requestAnimationFrame(() => setOpenRegister(true));
                }}
            />
            <PasskeyRegistration open={openRegister} onOpenChange={setOpenRegister} onSuccess={() => router.reload()} />
        </div>
    );
}