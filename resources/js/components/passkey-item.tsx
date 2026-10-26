import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { HugeiconsIcon } from '@hugeicons/react';
import { DeviceAccessIcon } from '@hugeicons/core-free-icons';

import type { Passkey } from '@/types/auth';

import { Button } from '@/components/ui/button';

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import PasskeyRename from './passkey-rename';

type Props = {
    passkey: Passkey;
    onDelete: (id: number, onError: () => void) => void;
};

export default function PasskeyItem({
    passkey,
    onDelete,
}: Props) {
    const [renameOpen, setRenameOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);

        onDelete(passkey.id, () => {
            setIsDeleting(false);
        });
    };

    return (
        <>
            <div className="flex items-center justify-between border-b p-0 last:border-b-0">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <HugeiconsIcon
                            icon={DeviceAccessIcon}
                            size={22}
                            className="text-muted-foreground"
                        />
                    </div>

                    <div className="space-y-0">
                        <div className="flex items-center gap-2">
                            <p className="font-medium">
                                {passkey.name}
                            </p>

                            {passkey.authenticator && (
                                <span className="inline-flex items-center rounded-md border bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {passkey.authenticator}
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Added {passkey.created_at_diff}

                            {passkey.last_used_at_diff && (
                                <>
                                    <span className="mx-1 opacity-50">
                                        /
                                    </span>

                                    Last used{' '}
                                    {passkey.last_used_at_diff}
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="w-44"
                    >
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                setRenameOpen(true);
                            }}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => {
                                e.preventDefault();
                                setDeleteOpen(true);
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <PasskeyRename
                open={renameOpen}
                onOpenChange={setRenameOpen}
                passkey={passkey}
            />

            <Dialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Remove passkey
                        </DialogTitle>

                        <DialogDescription>
                            Are you sure you want to remove{' '}
                            <strong>{passkey.name}</strong>?
                            This passkey will no longer be
                            available to sign in.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={handleDelete}
                        >
                            {isDeleting
                                ? 'Removing...'
                                : 'Remove passkey'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}