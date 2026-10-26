
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import { PanelRightCloseIcon, PanelRightOpenIcon } from "@hugeicons/core-free-icons";

interface SidebarTriggerCustomProps
    extends React.ComponentProps<typeof Button> { }

export default function SidebarTriggerCustom({
    className,
    onClick,
    ...props
}: SidebarTriggerCustomProps) {
    const { toggleSidebar, isMobile, state } = useSidebar();

    return (
        <Button
            data-sidebar="trigger-custom"
            variant="ghost"
            size="icon"
            className={cn("h-8 group-data-[collapsible=icon]:right-[0.100rem] [&_svg:not([class*='size-'])]:size-4", className)}
            onClick={(event) => {
                onClick?.(event);
                toggleSidebar();
            }}
            {...props}
        >
            {isMobile || state === "collapsed" ? (
                <HugeiconsIcon icon={PanelRightCloseIcon} size={16} />
            ) : (
                <HugeiconsIcon icon={PanelRightOpenIcon} size={16} />
            )}

            <span className="sr-only">Toggle sidebar</span>
        </Button>
    );
}