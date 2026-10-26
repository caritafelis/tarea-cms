import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";

interface Props {
    form: any;
    onSave: () => void;
}

const SUPPORTED_LANGUAGES = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    nl: "Dutch",
    ru: "Russian",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
};

export default function LanguagesSettings({
    form,
    onSave,
}: Props) {
    const locales =
        form.data.settings.locales || [];

    const defaultLocale =
        form.data.settings.default_locale;

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Languages
                </CardTitle>

                <CardDescription>
                    Configure available
                    languages for the CMS.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <div>
                    <Label>
                        Default Language
                    </Label>

                    <Select
                        value={defaultLocale}
                        onValueChange={(value) =>
                            form.setData(
                                "settings",
                                {
                                    ...form.data
                                        .settings,
                                    default_locale:
                                        value,
                                }
                            )
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                            {locales.map(
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
                                            SUPPORTED_LANGUAGES[
                                            locale as keyof typeof SUPPORTED_LANGUAGES
                                            ]
                                        }
                                    </SelectItem>
                                )
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <Label>
                        Active Languages
                    </Label>

                    {Object.entries(
                        SUPPORTED_LANGUAGES
                    ).map(
                        ([code, label]) => (
                            <label
                                key={code}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="checkbox"
                                    checked={locales.includes(
                                        code
                                    )}
                                    onChange={(
                                        e
                                    ) => {
                                        const next =
                                            e
                                                .target
                                                .checked
                                                ? [
                                                    ...locales,
                                                    code,
                                                ]
                                                : locales.filter(
                                                    (
                                                        x: string
                                                    ) =>
                                                        x !==
                                                        code
                                                );

                                        form.setData(
                                            "settings",
                                            {
                                                ...form
                                                    .data
                                                    .settings,
                                                locales:
                                                    next,
                                            }
                                        );
                                    }}
                                />

                                <span>
                                    {label}
                                </span>
                            </label>
                        )
                    )}
                </div>

                <div className="flex justify-end">
                    <Button
                        onClick={onSave}
                    >
                        Save Languages
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}