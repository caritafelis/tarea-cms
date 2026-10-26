
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex w-full items-center gap-2">
            <div
                className="
                    flex size-8 shrink-0 items-center justify-center
                    overflow-hidden rounded-md
                    transition-opacity duration-200
                    group-hover/logo:in-data-[collapsible=icon]:opacity-0
                "
            >
                <AppLogoIcon className="size-8" />
            </div>

            <div className="grid min-w-0 flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold leading-tight">
                    STUVGRAPH
                </span>
                <span className="truncate text-xs text-muted-foreground">
                    by STUVVION
                </span>
            </div>
        </div>
    );
}
