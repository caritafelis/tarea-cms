import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaItem, MediaItems } from "@/types/media";

interface Props {
    media: MediaItems[];
    selectedIds: number[];
    multiple?: boolean;
    hasMore: boolean;
    onSelect: (media: MediaItem) => void;
    onLoadMore: () => void;
}

export default function MediaGrid({
    media,
    selectedIds,
    multiple,
    hasMore,
    onSelect,
    onLoadMore,
}: Props) {
    const {
        ref,
        inView,
    } = useInView();

    useEffect(() => {
        if (
            inView &&
            hasMore
        ) {
            onLoadMore();
        }
    }, [
        inView,
        hasMore,
        onLoadMore,
    ]);

    function isMediaItem(
        item: MediaItems
    ): item is MediaItem {
        return !("uploading" in item);
    }

    return (
        <div className="h-full overflow-auto">

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">

                {media.map(
                    (
                        item
                    ) => {
                        const selected =
                            typeof item.id === 'number' &&
                            selectedIds.includes(item.id);

                        return (
                            <button
                                key={item.id}
                                type="button"
                                disabled={"uploading" in item}
                                onClick={() => {
                                    if (isMediaItem(item)) {
                                        onSelect(item);
                                    }
                                }}
                                className={cn(
                                    "group relative overflow-hidden rounded-lg border bg-background",
                                    selected && "ring-2 ring-primary",
                                    "uploading" in item && "cursor-default opacity-80"
                                )}
                            >
                                {"uploading" in item ? (

                                    <div className="relative aspect-square">

                                        <img
                                            src={item.preview}
                                            className="h-full w-full object-cover opacity-50"
                                        />

                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">

                                            <Loader2 className="h-6 w-6 animate-spin text-white" />

                                            <span className="mt-2 text-xs text-white">
                                                {item.progress}%
                                            </span>

                                        </div>

                                    </div>

                                ) : (

                                    <img
                                        src={
                                            item.thumb_url ??
                                            item.original_url
                                        }
                                        alt={item.name}
                                        className="aspect-square h-full w-full object-cover"
                                    />

                                )}

                                {selected && (
                                    <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}

                                <div className="border-t p-2 text-left">

                                    <p className="truncate text-xs font-medium">
                                        {
                                            item.file_name
                                        }
                                    </p>

                                </div>

                            </button>
                        );
                    }
                )}

            </div>

            <div
                ref={ref}
                className="h-20"
            />

        </div>
    );
}