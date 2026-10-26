import { useEffect, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { update as passkeysUpdate } from '@/routes/passkey/index';
import type { Passkey } from '@/types/auth';
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
import { Spinner } from './ui/spinner';

type Props = {
    passkey: Passkey;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function PasskeyRename({
    passkey,
    open,
    onOpenChange,
}: Props) {
    const {
        data,
        setData,
        patch,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        name: passkey.name,
    });

    useEffect(() => {
        setData('name', passkey.name);
    }, [passkey]);

    const handleOpenChange = (next: boolean) => {
        if (processing) {
            return;
        }

        onOpenChange(next);

        if (!next) {
            reset();
            clearErrors();
            setData('name', passkey.name);
        }
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!data.name.trim()) {
            return;
        }

        patch(passkeysUpdate({ passkey: passkey.id }).url, {
            preserveScroll: true,
            onSuccess: () => {
                handleOpenChange(false);
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogContent
                className="sm:max-w-lg"
                onInteractOutside={(e) => {
                    if (processing) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    if (processing) {
                        e.preventDefault();
                    }
                }}
            >
                {processing ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Spinner className="mb-4 size-8" />

                        <DialogTitle>
                            Saving changes...
                        </DialogTitle>

                        <DialogDescription className="mt-2 max-w-xs">
                            Updating your passkey name. This will only take a moment.
                        </DialogDescription>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>
                                Rename passkey
                            </DialogTitle>

                            <DialogDescription>
                                Change the display name of this passkey.
                                This name is only visible to you.
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
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                />

                                <p className="text-xs text-muted-foreground">
                                    This name helps you identify the passkey later.
                                </p>

                                <InputError message={errors.name} />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        handleOpenChange(false)
                                    }
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={
                                        !data.name.trim() ||
                                        data.name === passkey.name
                                    }
                                >
                                    Save changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}