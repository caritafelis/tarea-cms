import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { router } from "@inertiajs/react";
import { destroy } from "@/routes/admin/media-folders";
import { MediaFolder } from "@/types/media";

interface Props {
    folder: MediaFolder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeleted: () => void;
}

export default function FolderDeleteDialog({
    folder,
    open,
    onOpenChange,
    onDeleted,
}: Props) {
    if (!folder) {
        return null;
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            < AlertDialogContent >

                <AlertDialogHeader>

                    <AlertDialogTitle>
                        Delete Folder
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        This action cannot be
                        undone.
                    </AlertDialogDescription>

                </AlertDialogHeader>

                <AlertDialogFooter>

                    <AlertDialogCancel onClick={() => onOpenChange(false)}>
                        Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={() => router.delete(destroy(folder.id).url,
                            {
                                preserveScroll: true,
                                onSuccess: () => { onDeleted(); onOpenChange(false) },
                            }
                        )}
                    >
                        Delete
                    </AlertDialogAction>

                </AlertDialogFooter>

            </AlertDialogContent >
        </AlertDialog >
    );
}