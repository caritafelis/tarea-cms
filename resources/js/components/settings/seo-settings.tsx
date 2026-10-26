import { useState } from "react";

import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Props {
    form: any;
    onSave: () => void;
}

export default function SeoSettings({
    form,
    onSave,
}: Props) {
    const [locale, setLocale] =
        useState(
            form.data.settings
                .default_locale
        );

    const seo =
        form.data.settings.seo ??
        {};

    const current =
        seo[locale] ?? {};

    const update = (
        field: string,
        value: string
    ) => {
        form.setData("settings", {
            ...form.data.settings,

            seo: {
                ...seo,

                [locale]: {
                    ...current,

                    [field]: value,
                },
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    SEO Settings
                </CardTitle>

                <CardDescription>
                    Configure SEO
                    metadata by language.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <Select
                    value={locale}
                    onValueChange={
                        setLocale
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                        {form.data.settings.locales.map(
                            (
                                locale: string
                            ) => (
                                <SelectItem
                                    key={
                                        locale
                                    }
                                    value={
                                        locale
                                    }
                                >
                                    {
                                        locale
                                    }
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Site Title"
                    value={
                        current.site_title ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "site_title",
                            e.target.value
                        )
                    }
                />

                <Textarea
                    placeholder="Site Description"
                    value={
                        current.site_description ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "site_description",
                            e.target.value
                        )
                    }
                />

                <Input
                    placeholder="Keywords"
                    value={
                        current.keywords ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "keywords",
                            e.target.value
                        )
                    }
                />

                <Input
                    placeholder="Canonical URL"
                    value={
                        current.canonical_url ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "canonical_url",
                            e.target.value
                        )
                    }
                />

                <Input
                    placeholder="OpenGraph Title"
                    value={
                        current.og_title ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "og_title",
                            e.target.value
                        )
                    }
                />

                <Textarea
                    placeholder="OpenGraph Description"
                    value={
                        current.og_description ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "og_description",
                            e.target.value
                        )
                    }
                />

                <Input
                    placeholder="OpenGraph Image"
                    value={
                        current.og_image ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "og_image",
                            e.target.value
                        )
                    }
                />

                <Input
                    placeholder="Twitter Title"
                    value={
                        current.twitter_title ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "twitter_title",
                            e.target.value
                        )
                    }
                />

                <Textarea
                    placeholder="Twitter Description"
                    value={
                        current.twitter_description ??
                        ""
                    }
                    onChange={(e) =>
                        update(
                            "twitter_description",
                            e.target.value
                        )
                    }
                />

                <Button
                    onClick={onSave}
                >
                    Save SEO
                </Button>
            </CardContent>
        </Card>
    );
}