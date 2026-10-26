import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MediaItem } from "@/types/media";

interface Props {
    media: MediaItem | null;
    open: boolean;
    onClose: () => void;
    onReplaced: () => void;
}

export default function MediaReplaceDialog({
    media,
    open,
    onClose,
    onReplaced,
}: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    if (!media) { return null; }
    const upload = async () => {
        if (!file) return;

        setLoading(true);

        const data = new FormData();

        data.append("file", file);

        await fetch(`/admin/media/${media.id}/replace`,
            {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN":
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]'
                            ) as HTMLMetaElement
                        )?.content,
                },
                body: data,
            }
        );

        setLoading(false);

        onReplaced();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            < DialogContent >
                <DialogHeader>
                    <DialogTitle>
                        Replace File
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">

                    <div className="rounded-md border p-4">
                        <p className="font-medium">
                            Current File
                        </p>

                        <p className="text-sm text-muted-foreground">
                            {media.file_name}
                        </p>
                    </div>

                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />

                </div>

                <div className="flex justify-end gap-2">

                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>

                    <Button disabled={!file || loading} onClick={upload}>
                        Replace
                    </Button>

                </div>
            </DialogContent >
        </Dialog >
    );
}