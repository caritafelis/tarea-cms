import { useCallback, useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MediaGrid from "./media-grid";
import MediaToolbar from "./media-toolbar";
import MediaUpload from "./media-upload";
import FolderTree from "./folder-tree";
import MediaSidebar from "./media-sidebar";
import MediaTable from "./media-table";
import FolderCreateDialog from "./folder-create-dialog";
import FolderEditDialog from "./folder-edit-dialog";
import FolderDeleteDialog from "./folder-delete-dialog";
import { MediaFolder, MediaItem, MediaItems } from "@/types/media";
import { index as mediaIndex } from "@/routes/admin/media";
import { index as foldersIndex } from "@/routes/admin/media-folders";
import { usePage } from "@inertiajs/react";

type ViewMode = "grid" | "list";

interface MediaResponse {
    data: MediaItem[];
    current_page: number;
    last_page: number;
    total: number;
}

type BaseProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type SingleProps = BaseProps & {
    multiple?: false;
    onSelect: (media: MediaItem) => void;
};

type MultipleProps = BaseProps & {
    multiple: true;
    onSelect: (media: MediaItem[]) => void;
};

type Props = SingleProps | MultipleProps;

export default function MediaDialog({
    open,
    multiple = false,
    onOpenChange,
    onSelect,
}: Props) {
    const [media, setMedia] = useState<MediaItems[]>([]);
    const [folders, setFolders] = useState<MediaFolder[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [view, setView] = useState<ViewMode>("grid");
    const [search, setSearch] = useState("");
    const [folderId, setFolderId] = useState<number | null>(null);
    const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [editFolder, setEditFolder] = useState<MediaFolder | null>(null);
    const [deleteFolder, setDeleteFolder] = useState<MediaFolder | null>(null);
    const [parentFolderId, setParentFolderId] = useState<number>();

    const selectedMedia = selectedItems[0] ?? null;

    const resetState = useCallback(() => {
        setMedia([]);
        setCurrentPage(1);
        setLastPage(1);
        setSelectedItems([]);
    }, []);

    const { currentTeam } = usePage().props as {
        currentTeam: { id: number; slug: string };
    };

    const appendMedia = useCallback((item: MediaItem) => {
        setMedia(prev => [item, ...prev]);
    }, []);

    // Folders come from a dedicated media-folders endpoint, not the media
    // endpoint — the media index returns a paginated MediaItem list, not
    // an array of folders.
    const loadFolders = useCallback(async () => {
        try {
            const url = foldersIndex(currentTeam.slug).url;
            const response = await fetch(url, {
                headers: { Accept: "application/json" },
            });
            if (!response.ok) return;
            const data = await response.json();
            // The folders endpoint may return an array directly or wrapped
            // in { data: [...] } — handle both shapes.
            setFolders(Array.isArray(data) ? data : data.data ?? []);
        } catch {
            setFolders([]);
        }
    }, [currentTeam.slug]);

    const loadMedia = useCallback(
        async (page = 1, append = false) => {
            setLoading(true);
            try {
                // Use the Wayfinder-generated URL so the team slug is always
                // included. Hardcoding /admin/media bypasses the
                // /{current_team}/media route and returns 403.
                const { url: baseUrl } = mediaIndex(currentTeam.slug);
                const params = new URLSearchParams({ page: String(page) });
                if (folderId) params.set("folder_id", String(folderId));
                if (search) params.set("search", search);

                const response = await fetch(`${baseUrl}?${params.toString()}`, {
                    headers: { Accept: "application/json" },
                });
                if (!response.ok) return;

                const data: MediaResponse = await response.json();
                setCurrentPage(data.current_page);
                setLastPage(data.last_page);
                setMedia(append ? (prev) => [...prev, ...data.data] : data.data);
            } finally {
                setLoading(false);
            }
        },
        [currentTeam.slug, folderId, search],
    );

    useEffect(() => {
        if (!open) return;
        resetState();
        loadFolders();
        loadMedia();
    }, [open, folderId, search, loadFolders, loadMedia, resetState]);

    const loadMore = useCallback(() => {
        if (loading || currentPage >= lastPage) return;
        loadMedia(currentPage + 1, true);
    }, [loading, currentPage, lastPage, loadMedia]);

    const toggleSelection = (item: MediaItem) => {
        if (!multiple) {
            setSelectedItems([item]);
            return;
        }
        setSelectedItems((prev) => {
            const exists = prev.some((m) => m.id === item.id);
            return exists ? prev.filter((m) => m.id !== item.id) : [...prev, item];
        });
    };

    const handleConfirm = () => {
        if (selectedItems.length === 0) return;
        if (multiple) {
            (onSelect as (media: MediaItem[]) => void)(selectedItems);
        } else {
            (onSelect as (media: MediaItem) => void)(selectedItems[0]);
        }
        onOpenChange(false);
    };

    const refreshMedia = () => loadMedia();

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="
                        w-[98vw] h-[96vh]
                        sm:max-w-[98vw] md:max-w-[97vw]
                        lg:max-w-[96vw] xl:max-w-[98vw]
                        max-h-[96vh] p-0 overflow-hidden
                        rounded-xl flex flex-col
                    "
                >
                    <DialogHeader className="border-b px-6 py-4 shrink-0">
                        <DialogTitle>Media Library</DialogTitle>
                        <DialogDescription>
                            Browse and select media files from your library.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-[260px_1fr_340px] flex-1 min-h-0">
                        {/* Folder tree */}
                        <div className="border-r p-4 overflow-hidden min-h-0">
                            <FolderTree
                                folders={folders}
                                currentFolder={folderId}
                                onSelect={setFolderId}
                                onCreate={(parentId) => {
                                    setParentFolderId(parentId);
                                    setCreateFolderOpen(true);
                                }}
                                onEdit={(folder) => setEditFolder(folder)}
                                onDelete={(folder) => setDeleteFolder(folder)}
                            />
                        </div>

                        {/* Main content */}
                        <div className="flex flex-col overflow-hidden min-h-0">
                            <div className="border-b p-4 space-y-4">
                                <MediaToolbar
                                    search={search}
                                    view={view}
                                    onSearch={setSearch}
                                    onViewChange={setView}
                                />
                                <MediaUpload
                                    folderId={folderId}
                                    onUploaded={(item) =>
                                        setMedia(prev => [item, ...prev])
                                    }
                                    setMedia={setMedia}
                                />
                            </div>

                            <div className="flex-1 overflow-auto p-4 min-h-0">
                                {view === "grid" ? (
                                    <MediaGrid
                                        media={media}
                                        selectedIds={selectedItems.map((i) => i.id)}
                                        multiple={multiple}
                                        onSelect={toggleSelection}
                                        onLoadMore={loadMore}
                                        hasMore={currentPage < lastPage}
                                    />
                                ) : (
                                    <MediaTable
                                        media={media}
                                        selectedIds={selectedItems.map((i) => i.id)}
                                        multiple={multiple}
                                        onSelect={toggleSelection}
                                        onLoadMore={loadMore}
                                        hasMore={currentPage < lastPage}
                                    />
                                )}
                            </div>

                            <div className="border-t p-4 flex justify-between items-center">
                                <div className="text-sm text-muted-foreground">
                                    {selectedItems.length} selected
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        disabled={selectedItems.length === 0}
                                        onClick={handleConfirm}
                                    >
                                        Select
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="border-l overflow-hidden min-h-0">
                            <MediaSidebar media={selectedMedia} onUpdated={refreshMedia} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <FolderCreateDialog
                open={createFolderOpen}
                parentId={parentFolderId}
                onOpenChange={setCreateFolderOpen}
                onCreated={loadFolders}
            />

            <FolderEditDialog
                open={!!editFolder}
                folder={editFolder}
                onOpenChange={(open) => { if (!open) setEditFolder(null); }}
                onUpdated={loadFolders}
            />

            <FolderDeleteDialog
                open={!!deleteFolder}
                folder={deleteFolder}
                onOpenChange={(open) => { if (!open) setDeleteFolder(null); }}
                onDeleted={loadFolders}
            />
        </>
    );
}