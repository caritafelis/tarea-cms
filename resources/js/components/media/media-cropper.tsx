import { useCallback, useState } from "react";

import Cropper from "react-easy-crop";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MediaItem } from "@/types/media";

interface Props {
    open: boolean;
    media: MediaItem | null;
    onClose: () => void;
    onSaved: () => void;
}

export default function MediaCropper({
    open,
    media,
    onClose,
    onSaved,
}: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0, });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const onCropComplete = useCallback(
        (
            _: any,
            croppedPixels: any
        ) => {
            setCroppedAreaPixels(
                croppedPixels
            );
        },
        []
    );

    if (!media) { return null; }

    const save = async () => {
        await fetch(`/admin/media/${media.id}/crop`,
            {
                method: "PATCH",
                headers: {
                    Accept:
                        "application/json",
                    "Content-Type":
                        "application/json",
                    "X-CSRF-TOKEN":
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]'
                            ) as HTMLMetaElement
                        )?.content,
                },

                body: JSON.stringify({
                    crop: croppedAreaPixels,
                }),
            }
        );

        onSaved();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onClose}
        >
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>
                        Crop Image
                    </DialogTitle>
                </DialogHeader>

                <div className="relative h-[600px] rounded-md bg-black">
                    <Cropper
                        image={media.original_url}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="space-y-3">
                    <span className="text-sm">
                        Zoom
                    </span>

                    <Slider
                        value={[zoom]}
                        min={1}
                        max={4}
                        step={0.1}
                        onValueChange={(value) => setZoom(value[0])}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>

                    <Button onClick={save}>
                        Save Crop
                    </Button>
                </div>
            </DialogContent >
        </Dialog >
    );
}