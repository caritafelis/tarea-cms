import { FileImage } from "lucide-react";

import { MediaItem } from "@/types/media";

interface Props {
    media?: MediaItem | null;
}

export default function MediaPreview({
    media,
}: Props) {
    if (!media) {
        return (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                <span className="text-sm text-muted-foreground">
                    No media selected
                </span>
            </div>
        );
    }

    const isImage =
        media.mime_type.startsWith(
            "image/"
        );

    if (!isImage) {
        return (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border">
                <FileImage className="mb-2 h-8 w-8" />

                <span className="text-sm">
                    {media.file_name}
                </span>
            </div>
        );
    }

    return (
        <img
            src={
                media.thumb_url ??
                media.original_url
            }
            alt={media.name}
            className="h-40 w-full rounded-lg border object-cover"
        />
    );
}