import { useForm } from "@inertiajs/react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { store } from "@/routes/admin/media-folders";

interface Props {
    open: boolean;
    parentId?: number;
    onOpenChange: (open: boolean) => void;
    onCreated: () => void;
}

export default function FolderCreateDialog({
    open,
    onOpenChange,
    parentId,
    onCreated,
}: Props) {
    const form = useForm({
        name: "",

        parent_id:
            parentId ?? null,
    });

    const submit = () => {
        form.post(
            store().url,
            {
                preserveScroll: true,

                onSuccess: () => {
                    form.reset();

                    onCreated();

                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Create Folder
                    </DialogTitle>
                </DialogHeader>

                <Input
                    value={
                        form.data.name
                    }
                    placeholder="Folder Name"
                    onChange={(e) =>
                        form.setData(
                            "name",
                            e.target.value
                        )
                    }
                />

                <Button
                    onClick={submit}
                >
                    Create Folder
                </Button>
            </DialogContent>
        </Dialog>
    );
}