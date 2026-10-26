import { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { update } from "@/routes/admin/media-folders";
import { MediaFolder } from "@/types/media";

interface Props {
    folder: MediaFolder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdated: () => void;
}

export default function FolderEditDialog({
    folder,
    open,
    onOpenChange,
    onUpdated,
}: Props) {
    const form = useForm({
        name: "",
    });

    useEffect(() => {
        if (!folder) return;

        form.setData("name", folder.name);
    }, [folder]);

    if (!folder) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Rename Folder
                    </DialogTitle>
                </DialogHeader>

                <Input
                    value={form.data.name}
                    onChange={(e) => form.setData("name", e.target.value)}
                />

                <Button
                    onClick={() => form.put(update(folder.id).url,
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                onUpdated();
                                onOpenChange(false);
                            },
                        }
                    )}
                >
                    Save
                </Button>
            </DialogContent>
        </Dialog>
    );
}