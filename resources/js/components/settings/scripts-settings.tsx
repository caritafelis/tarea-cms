import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

import { Textarea } from "@/components/ui/textarea";

interface Props {
    form: any;
    onSave: () => void;
}

export default function ScriptsSettings({
    form,
    onSave,
}: Props) {
    const scripts =
        form.data.settings.scripts ??
        {};

    const update = (
        key: string,
        value: string
    ) => {
        form.setData("settings", {
            ...form.data.settings,

            scripts: {
                ...scripts,
                [key]: value,
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Custom Scripts
                </CardTitle>

                <CardDescription>
                    Add custom scripts
                    globally.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <Textarea
                    rows={10}
                    placeholder="Head"
                    value={
                        scripts.head ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "head",
                            e.target.value
                        )
                    }
                />

                <Textarea
                    rows={10}
                    placeholder="Body Start"
                    value={
                        scripts.body_start ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "body_start",
                            e.target.value
                        )
                    }
                />

                <Textarea
                    rows={10}
                    placeholder="Body End"
                    value={
                        scripts.body_end ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "body_end",
                            e.target.value
                        )
                    }
                />

                <Button
                    onClick={onSave}
                >
                    Save Scripts
                </Button>
            </CardContent>
        </Card>
    );
}