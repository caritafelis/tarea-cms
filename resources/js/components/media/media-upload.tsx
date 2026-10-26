import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { usePage } from "@inertiajs/react";
import api from "@/lib/api";
import { store } from "@/routes/admin/media";
import { MediaItem, MediaItems, UploadingMedia } from "@/types/media";
import { v4 as uuid } from "uuid";

interface Props {
    folderId?: number | null;
    onUploaded: (media: MediaItem) => void;
    setMedia: React.Dispatch<
        React.SetStateAction<MediaItems[]>
    >;
}

export default function MediaUpload({
    folderId,
    onUploaded,
    setMedia,
}: Props) {
    const { currentTeam } = usePage().props as {
        currentTeam: { id: number; slug: string };
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {

        const uploads = acceptedFiles.map(async (file) => {

            const tempId = uuid();

            const tempMedia: UploadingMedia = {
                id: tempId,
                folder_id: folderId ?? null,
                custom_properties: {},
                name: file.name,
                file_name: file.name,
                mime_type: file.type,
                size: file.size,
                original_url: '',
                thumb_url: '',
                uploading: true,
                progress: 0,
                preview: URL.createObjectURL(file),
            };

            setMedia(prev => [tempMedia, ...prev]);

            const formData = new FormData();
            formData.append('file', file);

            try {

                const response = await api.post(
                    store(currentTeam.slug).url,
                    formData,
                    {
                        onUploadProgress: (event) => {

                            const progress = Math.round(
                                (event.loaded * 100) /
                                (event.total ?? 1)
                            );

                            setMedia(prev =>
                                prev.map(item =>
                                    item.id === tempId
                                        ? {
                                            ...item,
                                            progress,
                                        }
                                        : item
                                )
                            );
                        },
                    }
                );

                setMedia(prev =>
                    prev.map(item =>
                        item.id === tempId
                            ? response.data
                            : item
                    )
                );

            } catch {

                setMedia(prev =>
                    prev.filter(
                        item => item.id !== tempId
                    )
                );
            }
        });

        // await Promise.all(uploads);

        // onUploaded();

    }, [folderId, onUploaded, currentTeam.slug]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
    });

    return (
        <div
            {...getRootProps()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8"
        >
            <input {...getInputProps()} />

            <UploadCloud className="mb-3 h-8 w-8" />

            <p className="text-sm">
                Drop files here or click to upload
            </p>
        </div>
    );
}