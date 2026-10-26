import { cn } from "@/lib/utils";

type SettingsSection =
    | "general"
    | "company"
    | "seo"
    | "social"
    | "tracking"
    | "languages"
    | "scripts";

interface Props {
    current: SettingsSection;
    onChange: (value: SettingsSection) => void;
}

const items = [
    {
        key: "general",
        label: "General",
        description:
            "Site name, logo and branding",
    },
    {
        key: "company",
        label: "Company",
        description:
            "Business information",
    },
    {
        key: "seo",
        label: "SEO",
        description:
            "Search engine optimization",
    },
    {
        key: "social",
        label: "Social",
        description:
            "Social network profiles",
    },
    {
        key: "tracking",
        label: "Tracking",
        description:
            "Analytics and pixels",
    },
    {
        key: "languages",
        label: "Languages",
        description:
            "Localization settings",
    },
    {
        key: "scripts",
        label: "Scripts",
        description:
            "Custom head and footer code",
    },
] as const;

export default function SettingsNavigation({
    current,
    onChange,
}: Props) {
    return (
        <nav className="flex flex-col gap-1">
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                        onChange(
                            item.key as SettingsSection
                        )
                    }
                    className={cn(
                        "flex flex-col items-start rounded-lg border p-3 text-left transition-colors",
                        current === item.key
                            ? "border-primary bg-muted"
                            : "hover:bg-muted/50"
                    )}
                >
                    <span className="font-medium">
                        {item.label}
                    </span>

                    <span className="text-xs text-muted-foreground">
                        {item.description}
                    </span>
                </button>
            ))}
        </nav>
    );
}