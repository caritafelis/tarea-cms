import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

interface Props {
    form: any;
    onSave: () => void;
}

export default function GeneralSettings({
    form,
    onSave,
}: Props) {
    const general =
        form.data.settings.general;

    const update = (
        key: string,
        value: string
    ) => {
        form.setData("settings", {
            ...form.data.settings,

            general: {
                ...general,
                [key]: value,
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    General Settings
                </CardTitle>

                <CardDescription>
                    Configure the basic site
                    information used
                    throughout the CMS.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="site_name">
                        Site Name
                    </Label>

                    <Input
                        id="site_name"
                        value={
                            general.site_name ??
                            ""
                        }
                        onChange={(e) =>
                            update(
                                "site_name",
                                e.target.value
                            )
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="tagline">
                        Tagline
                    </Label>

                    <Input
                        id="tagline"
                        value={
                            general.tagline ??
                            ""
                        }
                        onChange={(e) =>
                            update(
                                "tagline",
                                e.target.value
                            )
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="logo">
                        Logo URL
                    </Label>

                    <Input
                        id="logo"
                        value={
                            general.logo ?? ""
                        }
                        onChange={(e) =>
                            update(
                                "logo",
                                e.target.value
                            )
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="favicon">
                        Favicon URL
                    </Label>

                    <Input
                        id="favicon"
                        value={
                            general.favicon ??
                            ""
                        }
                        onChange={(e) =>
                            update(
                                "favicon",
                                e.target.value
                            )
                        }
                    />
                </div>

                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={onSave}
                        disabled={
                            form.processing
                        }
                    >
                        Save Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}