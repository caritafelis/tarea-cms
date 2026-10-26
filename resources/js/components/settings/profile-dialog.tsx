import { useMemo, useRef } from 'react';
import { useForm, usePage } from '@inertiajs/react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import InputError from '@/components/input-error';

import { useInitials } from '@/hooks/use-initials';

import { update as profileUpdate } from '@/routes/profile';

import type { Auth } from '@/types';
import { HugeiconsIcon } from '@hugeicons/react';
import { Camera01Icon } from '@hugeicons/core-free-icons';

interface ProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ProfileDialog({
    open,
    onOpenChange,
}: ProfileDialogProps) {
    const { auth } = usePage<{ auth: Auth }>().props;

    const getInitials = useInitials();

    const inputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        name: auth.user.name,
        email: auth.user.email,
        avatar: null as File | null,
    });

    const {
        data,
        setData,
        processing,
        errors,
        recentlySuccessful,
    } = form;

    const preview = useMemo(() => {
        if (data.avatar) {
            return URL.createObjectURL(data.avatar);
        }

        return auth.user.avatar ?? undefined;
    }, [data.avatar, auth.user.avatar]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.submit(profileUpdate(), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setTimeout(() => onOpenChange(false), 800);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>Profile edit</DialogTitle>

                    <DialogDescription>
                        Update your profile information.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 pt-2"
                >
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="group relative cursor-pointer"
                        >
                            <Avatar className="h-24 w-24 cursor-pointer rounded-full border">
                                {preview ? (
                                    <AvatarImage
                                        src={preview}
                                        alt={auth.user.name}
                                    />
                                ) : null}

                                <AvatarFallback className="text-xl">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="absolute inset-0 rounded-full bg-black/0 transition group-hover:bg-black/30" />

                            <div className="absolute bottom-0 right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm">
                                <HugeiconsIcon icon={Camera01Icon} size={16} />
                            </div>
                        </button>

                        <Input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                                setData(
                                    'avatar',
                                    e.target.files?.[0] ?? null
                                )
                            }
                        />
                    </div>

                    <InputError message={errors.avatar} />

                    <div className="grid gap-2">
                        <Label htmlFor="profile-name">
                            Name
                        </Label>

                        <Input
                            id="profile-name"
                            value={data.name}
                            onChange={(e) =>
                                setData('name', e.target.value)
                            }
                            autoComplete="name"
                            required
                        />

                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="profile-email">
                            Email address
                        </Label>

                        <Input
                            id="profile-email"
                            type="email"
                            value={data.email}
                            onChange={(e) =>
                                setData('email', e.target.value)
                            }
                            autoComplete="username"
                            required
                        />

                        <InputError message={errors.email} />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        {recentlySuccessful && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                                Saved successfully.
                            </p>
                        )}

                        <div className="ml-auto flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    onOpenChange(false)
                                }
                                disabled={processing}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                disabled={processing}
                            >
                                {processing
                                    ? 'Saving…'
                                    : 'Save changes'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}