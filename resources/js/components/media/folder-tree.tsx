import {
    Folder,
    FolderOpen,
    MoreHorizontal,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { MediaFolder } from "@/types/media";

interface Props {
    folders: MediaFolder[];
    currentFolder?: number | null;
    onSelect: (folderId: number | null) => void;
    onCreate: (parentId?: number) => void;
    onEdit: (folder: MediaFolder) => void;
    onDelete: (folder: MediaFolder) => void;
}

export default function FolderTree({
    folders,
    currentFolder,
    onSelect,
    onCreate,
    onEdit,
    onDelete,
}: Props) {
    return (
        <div className="space-y-1">
            <Button
                variant={
                    currentFolder === null
                        ? "secondary"
                        : "ghost"
                }
                className="w-full justify-start"
                onClick={() =>
                    onSelect(null)
                }
            >
                <FolderOpen className="mr-2 h-4 w-4" />
                All Files
            </Button>

            {folders.map((folder) => (
                <FolderNode
                    key={folder.id}
                    folder={folder}
                    level={0}
                    currentFolder={currentFolder}
                    onSelect={onSelect}
                    onCreate={onCreate}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}

function FolderNode({
    folder,
    level,
    currentFolder,
    onSelect,
    onCreate,
    onEdit,
    onDelete,
}: {
    folder: MediaFolder;
    level: number;
    currentFolder?: number | null;
    onSelect: (folderId: number) => void;
    onCreate: (parentId?: number) => void;
    onEdit: (folder: MediaFolder) => void;
    onDelete: (folder: MediaFolder) => void;
}) {
    return (
        <div>
            <div
                className="flex items-center gap-1"
                style={{
                    paddingLeft:
                        level * 16,
                }}
            >
                <Button
                    variant={
                        currentFolder ===
                            folder.id
                            ? "secondary"
                            : "ghost"
                    }
                    className="flex-1 justify-start"
                    onClick={() =>
                        onSelect(
                            folder.id
                        )
                    }
                >
                    <Folder className="mr-2 h-4 w-4" />
                    {folder.name}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger
                        asChild
                    >
                        <Button
                            size="icon"
                            variant="ghost"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent>
                        <DropdownMenuItem
                            onClick={() =>
                                onCreate(
                                    folder.id
                                )
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Folder
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() =>
                                onEdit(
                                    folder
                                )
                            }
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                                onDelete(
                                    folder
                                )
                            }
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {folder.children?.map(
                (child) => (
                    <FolderNode
                        key={child.id}
                        folder={child}
                        level={
                            level + 1
                        }
                        currentFolder={
                            currentFolder
                        }
                        onSelect={
                            onSelect
                        }
                        onCreate={
                            onCreate
                        }
                        onEdit={onEdit}
                        onDelete={
                            onDelete
                        }
                    />
                )
            )}
        </div>
    );
}