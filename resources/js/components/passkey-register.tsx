import { useState } from 'react';
import { usePasskeyRegister } from '@laravel/passkeys/react';

import InputError from '@/components/input-error';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

function defaultName() {
    const ua = navigator.userAgent;

    const browser = [
        'Chrome',
        'Firefox',
        'Safari',
        'Edge',
        'Opera',
    ].find((browser) => new RegExp(browser).test(ua));

    const os = [
        'Mac',
        'Windows',
        'iPhone',
        'iPad',
        'Android',
    ].find((os) => new RegExp(os).test(ua));

    return [browser, os].filter(Boolean).join(' on ');
}

export default function PasskeyRegistration({
    open,
    onOpenChange,
    onSuccess,
}: Props) {
    const [name, setName] = useState(defaultName);

    const {
        register,
        isLoading,
        error,
        isSupported,
    } = usePasskeyRegister({
        onSuccess: () => {
            onOpenChange(false);
            setName(defaultName());
            onSuccess();
        },
    });

    const submit = async (
        e: React.FormEvent<HTMLFormElement>,
    ) => {
        e.preventDefault();

        if (!name.trim()) return;

        await register(name);
    };

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);

        if (!next) {
            setName(defaultName());
        }
    };

    if (!isSupported) {
        return (
            <div className="text-sm text-muted-foreground">
                Passkeys are not supported.
            </div>
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Register a passkey
                    </DialogTitle>

                    <DialogDescription>
                        Give this passkey a recognizable name.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={submit}
                    className="space-y-5"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="passkey-name">
                            Passkey name
                        </Label>

                        <Input
                            id="passkey-name"
                            autoFocus
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                        />

                        <p className="text-xs text-muted-foreground">
                            Only visible to you.
                        </p>
                    </div>

                    {error && (
                        <InputError message={error} />
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                                onOpenChange(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={
                                isLoading ||
                                !name.trim()
                            }
                        >
                            {isLoading
                                ? 'Registering...'
                                : 'Register passkey'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}