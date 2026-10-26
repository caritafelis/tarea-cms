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

import { Textarea } from "@/components/ui/textarea";

interface Props {
    form: any;
    onSave: () => void;
}

export default function TrackingSettings({
    form,
    onSave,
}: Props) {
    const tracking =
        form.data.settings.tracking;

    const update = (
        key: string,
        value: string
    ) => {
        form.setData("settings", {
            ...form.data.settings,

            tracking: {
                ...tracking,
                [key]: value,
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Tracking & Analytics
                </CardTitle>

                <CardDescription>
                    Analytics platforms,
                    pixels and verification
                    tools.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>
                            Google Analytics
                        </Label>

                        <Input
                            placeholder="G-XXXXXXXXXX"
                            value={
                                tracking.google_analytics ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "google_analytics",
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>
                            Google Tag Manager
                        </Label>

                        <Input
                            placeholder="GTM-XXXXXXX"
                            value={
                                tracking.google_tag_manager ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "google_tag_manager",
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>
                            Microsoft Clarity
                        </Label>

                        <Input
                            value={
                                tracking.microsoft_clarity ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "microsoft_clarity",
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>
                            Meta Pixel
                        </Label>

                        <Input
                            value={
                                tracking.meta_pixel ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "meta_pixel",
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>
                            TikTok Pixel
                        </Label>

                        <Input
                            value={
                                tracking.tiktok_pixel ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "tiktok_pixel",
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>
                            Google Site Verification
                        </Label>

                        <Input
                            value={
                                tracking.google_site_verification ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "google_site_verification",
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>
                        Additional Head Code
                    </Label>

                    <Textarea
                        rows={8}
                        value={
                            tracking.custom_head ??
                            ""
                        }
                        onChange={(e) =>
                            update(
                                "custom_head",
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