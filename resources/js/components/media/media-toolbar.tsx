import {
    Grid3X3,
    List,
    Search,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

interface Props {
    search: string;

    view: "grid" | "list";

    onSearch: (
        value: string
    ) => void;

    onViewChange: (
        view: "grid" | "list"
    ) => void;
}

export default function MediaToolbar({
    search,
    view,
    onSearch,
    onViewChange,
}: Props) {
    return (
        <div className="flex items-center gap-3">

            <div className="relative flex-1">

                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                    value={search}
                    placeholder="Search media..."
                    className="pl-9"
                    onChange={(e) =>
                        onSearch(
                            e.target.value
                        )
                    }
                />

            </div>

            <div className="flex items-center rounded-md border">

                <Button
                    type="button"
                    size="icon"
                    variant={
                        view === "grid"
                            ? "default"
                            : "ghost"
                    }
                    onClick={() =>
                        onViewChange(
                            "grid"
                        )
                    }
                >
                    <Grid3X3 className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    size="icon"
                    variant={
                        view === "list"
                            ? "default"
                            : "ghost"
                    }
                    onClick={() =>
                        onViewChange(
                            "list"
                        )
                    }
                >
                    <List className="h-4 w-4" />
                </Button>

            </div>

        </div>
    );
}