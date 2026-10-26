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

export default function SocialSettings({
    form,
    onSave,
}: Props) {
    const social =
        form.data.settings.social;

    const update = (
        key: string,
        value: string
    ) => {
        form.setData("settings", {
            ...form.data.settings,

            social: {
                ...social,
                [key]: value,
            },
        });
    };

    const fields = [
        "facebook",
        "instagram",
        "linkedin",
        "youtube",
        "x",
        "tiktok",
        "threads",
        "pinterest",
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Social Networks
                </CardTitle>

                <CardDescription>
                    Public social media
                    profiles.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {fields.map((field) => (
                    <div
                        key={field}
                        className="space-y-2"
                    >
                        <Label>
                            {field
                                .charAt(0)
                                .toUpperCase() +
                                field.slice(1)}
                        </Label>

                        <Input
                            placeholder={`https://${field}.com/...`}
                            value={
                                social[
                                field
                                ] ?? ""
                            }
                            onChange={(e) =>
                                update(
                                    field,
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>
                ))}

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