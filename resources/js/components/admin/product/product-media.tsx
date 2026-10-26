import { router } from '@inertiajs/react';
import {
    FileText,
    ImagePlus,
    Trash2,
    UploadCloud,
} from 'lucide-react';
import { useRef, useState } from 'react';

import productRoutes from '@/actions/App/Http/Controllers/Admin/ProductController';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type MediaItem = {
    id: number;
    collection: string;
    name: string;
    url: string;
    mime: string | null;
};

const MAX_FILE_SIZE =
    10 * 1024 * 1024;

function useMedia(
    team: string,
    productId: number,
) {
    const [busy, setBusy] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const uploadUrl =
        productRoutes.uploadMedia.url({
            current_team: team,
            product: productId,
        });

    const remove = (
        id: number,
        onDone?: () => void,
    ) => {
        router.delete(
            productRoutes.destroyMedia.url({
                current_team: team,
                product: productId,
                media: id,
            }),
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: onDone,
            },
        );
    };

    const upload = (
        files: File[],
        collection: string,
        imagesOnly: boolean,
    ) => {
        const queue = files.filter(
            (file) => {
                if (
                    file.size >
                    MAX_FILE_SIZE
                ) {
                    setError(
                        `${file.name} is larger than 10 MB.`,
                    );

                    return false;
                }

                if (
                    imagesOnly &&
                    !file.type.startsWith(
                        'image/',
                    )
                ) {
                    setError(
                        `${file.name} is not an image.`,
                    );

                    return false;
                }

                return true;
            },
        );

        if (!queue.length) {
            return;
        }

        setBusy(true);
        setError(null);

        const next = (
            index: number,
        ) => {
            if (
                index >=
                queue.length
            ) {
                setBusy(false);
                return;
            }

            router.post(
                uploadUrl,
                {
                    file: queue[index],
                    collection,
                },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    preserveState: true,

                    onSuccess: () =>
                        next(
                            index + 1,
                        ),

                    onError: (
                        errors,
                    ) => {
                        const message =
                            Object.values(
                                errors,
                            )[0];

                        setError(
                            String(
                                message ??
                                'Upload failed.',
                            ),
                        );

                        setBusy(false);
                    },

                    onFinish: () => {
                        if (
                            index ===
                            queue.length -
                            1
                        ) {
                            setBusy(
                                false,
                            );
                        }
                    },
                },
            );
        };

        next(0);
    };

    return {
        busy,
        error,
        upload,
        remove,
    };
}

function Dropzone({
    onFiles,
    multiple = false,
    accept,
    busy = false,
    label,
    className,
}: {
    onFiles: (
        files: File[],
    ) => void;
    multiple?: boolean;
    accept?: string;
    busy?: boolean;
    label: string;
    className?: string;
}) {
    const input =
        useRef<HTMLInputElement>(
            null,
        );

    const [dragging, setDragging] =
        useState(false);

    const selectFiles = (
        files: File[],
    ) => {
        if (!files.length) {
            return;
        }

        onFiles(files);
    };

    return (
        <button
            type="button"
            disabled={busy}
            onClick={() =>
                input.current?.click()
            }
            onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() =>
                setDragging(false)
            }
            onDrop={(event) => {
                event.preventDefault();
                setDragging(false);

                selectFiles(
                    Array.from(
                        event.dataTransfer
                            .files,
                    ),
                );
            }}
            className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground transition-colors',
                'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-60',
                dragging &&
                'border-primary bg-primary/5 text-foreground',
                className,
            )}
        >
            <UploadCloud className="h-5 w-5" />

            {label && (
                <span className="font-medium">
                    {busy
                        ? 'Uploading…'
                        : label}
                </span>
            )}

            <span className="text-xs">
                {busy
                    ? 'Please wait'
                    : 'Drag & drop or click to upload · Max 10 MB'}
            </span>

            <input
                ref={input}
                type="file"
                hidden
                multiple={multiple}
                accept={accept}
                onChange={(event) => {
                    selectFiles(
                        Array.from(
                            event.target
                                .files ??
                            [],
                        ),
                    );

                    event.target.value =
                        '';
                }}
            />
        </button>
    );
}

function ErrorMessage({
    message,
}: {
    message: string | null;
}) {
    if (!message) {
        return null;
    }

    return (
        <p
            role="alert"
            className="text-xs text-destructive"
        >
            {message}
        </p>
    );
}

export function ProductImage({
    team,
    productId,
    media,
}: {
    team: string;
    productId: number;
    media: MediaItem[];
}) {
    const {
        busy,
        error,
        upload,
        remove,
    } = useMedia(
        team,
        productId,
    );

    const items = media.filter(
        (item) =>
            item.collection ===
            'thumbnail',
    );

    const current = items[0];

    const replace = (
        files: File[],
    ) => {
        const file = files[0];

        if (!file) {
            return;
        }

        if (!items.length) {
            upload(
                [file],
                'thumbnail',
                true,
            );

            return;
        }

        remove(
            current.id,
            () =>
                upload(
                    [file],
                    'thumbnail',
                    true,
                ),
        );
    };

    return (
        <div className="space-y-3">
            {current ? (
                <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                    <img
                        src={current.url}
                        alt={
                            current.name
                        }
                        className="aspect-square w-full object-cover"
                    />

                    <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <label className="flex-1">
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(
                                    event,
                                ) => {
                                    replace(
                                        Array.from(
                                            event
                                                .target
                                                .files ??
                                            [],
                                        ),
                                    );

                                    event.target.value =
                                        '';
                                }}
                            />

                            <span className="flex h-9 cursor-pointer items-center justify-center rounded-md bg-background/95 px-3 text-sm font-medium shadow-sm">
                                Replace
                            </span>
                        </label>

                        <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            aria-label="Remove product image"
                            onClick={() =>
                                remove(
                                    current.id,
                                )
                            }
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <Dropzone
                    onFiles={replace}
                    accept="image/*"
                    busy={busy}
                    label="Add product image"
                    className="aspect-square w-full"
                />
            )}

            <p className="text-xs text-muted-foreground">
                This image is stored in the existing
                <code className="mx-1 rounded bg-muted px-1 py-0.5">
                    thumbnail
                </code>
                media collection.
            </p>

            <ErrorMessage
                message={error}
            />
        </div>
    );
}

export function ProductGallery({
    team,
    productId,
    media,
}: {
    team: string;
    productId: number;
    media: MediaItem[];
}) {
    const {
        busy,
        error,
        upload,
        remove,
    } = useMedia(
        team,
        productId,
    );

    const items = media.filter(
        (item) =>
            item.collection ===
            'gallery',
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold">
                        Product gallery
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Add supporting product images.
                    </p>
                </div>

                <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                    {items.length}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-muted/20"
                    >
                        <img
                            src={item.url}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        />

                        <button
                            type="button"
                            aria-label={`Remove ${item.name}`}
                            onClick={() =>
                                remove(
                                    item.id,
                                )
                            }
                            className="absolute right-1.5 top-1.5 rounded-full bg-background/95 p-1.5 opacity-0 shadow-sm transition-opacity hover:bg-background focus-visible:opacity-100 group-hover:opacity-100"
                        >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                    </div>
                ))}

                <Dropzone
                    onFiles={(files) =>
                        upload(
                            files,
                            'gallery',
                            true,
                        )
                    }
                    multiple
                    accept="image/*"
                    busy={busy}
                    label=""
                    className="aspect-square p-1 [&>svg]:h-5 [&>svg]:w-5 [&>span]:hidden"
                />
            </div>

            {!items.length && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ImagePlus className="h-3.5 w-3.5" />
                    Add images to build the product gallery.
                </div>
            )}

            <ErrorMessage
                message={error}
            />
        </div>
    );
}

export function ProductFiles({
    team,
    productId,
    media,
}: {
    team: string;
    productId: number;
    media: MediaItem[];
}) {
    const {
        busy,
        error,
        upload,
        remove,
    } = useMedia(
        team,
        productId,
    );

    const items = media.filter(
        (item) =>
            item.collection ===
            'files',
    );

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold">
                    Downloadable files
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                    Files stored using the existing product media endpoint.
                </p>
            </div>

            {items.length > 0 && (
                <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className="flex items-center gap-3 p-3"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <a
                                href={
                                    item.url
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                            >
                                {
                                    item.name
                                }
                            </a>

                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={`Remove ${item.name}`}
                                onClick={() =>
                                    remove(
                                        item.id,
                                    )
                                }
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <Dropzone
                onFiles={(files) =>
                    upload(
                        files,
                        'files',
                        false,
                    )
                }
                multiple
                busy={busy}
                label="Upload files"
            />

            <ErrorMessage
                message={error}
            />
        </div>
    );
}