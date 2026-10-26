import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { MediaItem, MediaItems } from "@/types/media";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    media: MediaItems[];
    selectedIds: number[];
    multiple?: boolean;
    hasMore: boolean;
    onSelect: (media: MediaItem) => void;
    onLoadMore: () => void;
}

export default function MediaTable({
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

            <Table>

                <TableHeader>

                    <TableRow>

                        <TableHead className="w-12" />

                        <TableHead>
                            Preview
                        </TableHead>

                        <TableHead>
                            Name
                        </TableHead>

                        <TableHead>
                            Type
                        </TableHead>

                        <TableHead>
                            Size
                        </TableHead>

                    </TableRow>

                </TableHeader>

                <TableBody>

                    {media.map(
                        (
                            item
                        ) => (
                            <TableRow
                                key={item.id}
                                className={cn(
                                    "cursor-pointer",
                                    "uploading" in item && "cursor-default"
                                )}
                                onClick={() => {
                                    if (isMediaItem(item)) {
                                        onSelect(item);
                                    }
                                }}
                            >

                                <TableCell>

                                    <Checkbox checked={typeof item.id === 'number' ? selectedIds.includes(item.id) : false}
                                    />

                                </TableCell>

                                <TableCell>

                                    <div className="relative">

                                        <img
                                            src={
                                                "uploading" in item
                                                    ? item.preview
                                                    : item.thumb_url ??
                                                    item.original_url
                                            }
                                            className="h-14 w-14 rounded-md object-cover"
                                        />

                                        {"uploading" in item && (
                                            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/60">
                                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                                            </div>
                                        )}

                                    </div>

                                </TableCell>

                                <TableCell>
                                    {
                                        item.file_name
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        item.mime_type
                                    }
                                </TableCell>

                                <TableCell>

                                    {(
                                        item.size /
                                        1024 /
                                        1024
                                    ).toFixed(
                                        2
                                    )}{" "}
                                    MB

                                </TableCell>

                            </TableRow>
                        )
                    )}

                </TableBody>

            </Table>

            <div
                ref={ref}
                className="h-20"
            />

        </div>
    );
}