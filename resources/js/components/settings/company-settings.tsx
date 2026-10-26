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

import { Separator } from "@/components/ui/separator";

interface Props {
    form: any;
    onSave: () => void;
}

export default function CompanySettings({
    form,
    onSave,
}: Props) {
    const company =
        form.data.settings.company ?? {};

    const update = (
        key: string,
        value: any
    ) => {
        form.setData("settings", {
            ...form.data.settings,

            company: {
                ...company,
                [key]: value,
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Company Information
                </CardTitle>

                <CardDescription>
                    Global business data used
                    by SEO, Schema.org,
                    invoices, emails and
                    public pages.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">

                <div>
                    <h3 className="font-medium">
                        Business Identity
                    </h3>

                    <Separator className="my-4" />

                    <div className="grid gap-4 md:grid-cols-2">

                        <div className="space-y-2">
                            <Label>
                                Company Name
                            </Label>

                            <Input
                                value={
                                    company.company_name ??
                                    ""
                                }
                                onChange={(e) =>
                                    update(
                                        "company_name",
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Legal Name
                            </Label>

                            <Input
                                value={
                                    company.legal_name ??
                                    ""
                                }
                                onChange={(e) =>
                                    update(
                                        "legal_name",
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Tax ID / VAT / RUC
                            </Label>

                            <Input
                                value={
                                    company.tax_id ??
                                    ""
                                }
                                onChange={(e) =>
                                    update(
                                        "tax_id",
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Founded Year
                            </Label>

                            <Input
                                value={
                                    company.founded_year ??
                                    ""
                                }
                                onChange={(e) =>
                                    update(
                                        "founded_year",
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                    </div>
                </div>

                <div>
                    <h3 className="font-medium">
                        Contact Information
                    </h3>

                    <Separator className="my-4" />

                    <div className="grid gap-4 md:grid-cols-2">

                        <Input
                            placeholder="Primary Email"
                            value={
                                company.email ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "email",
                                    e.target.value
                                )
                            }
                        />

                        <Input
                            placeholder="Support Email"
                            value={
                                company.support_email ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "support_email",
                                    e.target.value
                                )
                            }
                        />

                        <Input
                            placeholder="Sales Email"
                            value={
                                company.sales_email ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "sales_email",
                                    e.target.value
                                )
                            }
                        />

                        <Input
                            placeholder="Phone"
                            value={
                                company.phone ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "phone",
                                    e.target.value
                                )
                            }
                        />

                        <Input
                            placeholder="WhatsApp"
                            value={
                                company.whatsapp ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "whatsapp",
                                    e.target.value
                                )
                            }
                        />

                        <Input
                            placeholder="Website"
                            value={
                                company.website ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "website",
                                    e.target.value
                                )
                            }
                        />
                    </div>
                </div>

                <div>
                    <h3 className="font-medium">
                        Address
                    </h3>

                    <Separator className="my-4" />

                    <div className="space-y-4">

                        <Textarea
                            rows={3}
                            placeholder="Address"
                            value={
                                company.address ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "address",
                                    e.target.value
                                )
                            }
                        />

                        <div className="grid gap-4 md:grid-cols-2">

                            <Input
                                placeholder="City"
                                value={
                                    company.city ??
                                    ""
                                }
                                onChange={(e) =>
                                    update(
                                        "city",
                                        e.target.value
                                    )
                                }
                            />

                            <Input
                                placeholder="State"
                                value={
                                    company.state ??
                                    ""
                                }
                                onChange={(e) =>
                                    update(
                                        "state",
                                        e.target.value
                                    )
                                }
                            />

                            <Input
                                placeholder="Country"
                                value={
                                    company.country ??
                                    ""
                                }
                                onChange={(e) =>
                                    update(
                                        "country",
                                        e.target.value
                                    )
                                }
                            />

                            <Input
                                placeholder="Postal Code"
                                value={
                                    company.postal_code ??
                                    ""
                                }
                                onChange={(e) =>
                                    update(
                                        "postal_code",
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-medium">
                        Geo Coordinates
                    </h3>

                    <Separator className="my-4" />

                    <div className="grid gap-4 md:grid-cols-2">

                        <Input
                            placeholder="Latitude"
                            value={
                                company.latitude ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "latitude",
                                    e.target.value
                                )
                            }
                        />

                        <Input
                            placeholder="Longitude"
                            value={
                                company.longitude ??
                                ""
                            }
                            onChange={(e) =>
                                update(
                                    "longitude",
                                    e.target.value
                                )
                            }
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={onSave}
                        disabled={
                            form.processing
                        }
                    >
                        Save Company
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}