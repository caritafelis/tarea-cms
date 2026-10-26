import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MediaItem } from "@/types/media";
import { Crop } from "lucide-react";
import { RefreshCcw } from "lucide-react";
import MediaCropper from "./media-cropper";
import MediaReplaceDialog from "./media-replace-dialog";

interface Props {
    media: MediaItem | null;
    onUpdated: () => void;
}

export default function MediaSidebar({
    media,
    onUpdated,
}: Props) {
    const [cropOpen, setCropOpen] = useState(false);
    const [replaceOpen, setReplaceOpen] = useState(false);
    const form = useForm({
        alt: "",
        title: "",
        caption: "",
        description: "",
    });

    useEffect(() => {
        if (!media) { return; }

        form.setData({
            alt: media.custom_properties?.alt ?? "",
            title: media.custom_properties?.title ?? "",
            caption: media.custom_properties?.caption ?? "",
            description: media.custom_properties?.description ?? "",
        });
    }, [media]);

    if (!media) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a file
            </div>
        );
    }

    const save =
        async () => {
            await fetch(
                `/admin/media/${media.id}/metadata`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",

                        Accept: "application/json",

                        "X-CSRF-TOKEN":
                            (
                                document.querySelector(
                                    'meta[name="csrf-token"]'
                                ) as HTMLMetaElement
                            )?.content,
                    },
                    body: JSON.stringify(form.data),
                }
            );

            onUpdated();
        };

    return (
        <div className="h-full overflow-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>
                        Media Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <img
                        src={media.large_url ?? media.original_url}
                        alt={media.name}
                        className="w-full rounded-md border"
                    />
                    <div>
                        <Label>
                            File Name
                        </Label>
                        <Input readOnly value={media.file_name} />
                    </div>

                    <div>
                        <Label>
                            Alt Text
                        </Label>
                        <Input value={form.data.alt} onChange={(e) => form.setData("alt", e.target.value)} />
                    </div>
                    <div>
                        <Label>
                            Title
                        </Label>
                        <Input value={form.data.title} onChange={(e) => form.setData("title", e.target.value)} />

                    </div>
                    <div>
                        <Label>
                            Caption
                        </Label>
                        <Textarea rows={3} value={form.data.caption} onChange={(e) => form.setData("caption", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">

                        <Button
                            variant="outline"
                            type="button"
                            onClick={() =>
                                setCropOpen(true)
                            }
                        >
                            <Crop className="mr-2 h-4 w-4" />
                            Crop
                        </Button>

                        <Button
                            variant="outline"
                            type="button"
                            onClick={() =>
                                setReplaceOpen(
                                    true
                                )
                            }
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Replace
                        </Button>

                    </div>
                    <div>
                        <Label>
                            Description
                        </Label>
                        <Textarea rows={5} value={form.data.description} onChange={(e) => form.setData("description", e.target.value)} />
                    </div>
                    <Button className="w-full" onClick={save}>
                        Save Metadata
                    </Button>
                </CardContent>
            </Card>
            <MediaCropper
                open={cropOpen}
                media={media}
                onClose={() =>
                    setCropOpen(false)
                }
                onSaved={onUpdated}
            />

            <MediaReplaceDialog
                open={replaceOpen}
                media={media}
                onClose={() =>
                    setReplaceOpen(false)
                }
                onReplaced={onUpdated}
            />
        </div>
    );
}