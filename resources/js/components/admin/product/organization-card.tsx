import { FormField } from '@/components/admin/form-fields';
import { MultiCheck } from '@/components/admin/multi-check';

type Ref = {
    id: number;
    name: string;
};

const refs = (items: Ref[]) =>
    items.map((item) => ({
        value: item.id,
        label: item.name,
    }));

export function OrganizationCard({
    data,
    setData,
    errors,
    brands,
    suppliers,
    categories,
    collections,
    tags,
    channels,
}: {
    data: Record<string, any>;
    setData: (
        key: string,
        value: any,
    ) => void;
    errors: Record<
        string,
        string | undefined
    >;
    brands: Ref[];
    suppliers: Ref[];
    categories: Ref[];
    collections: Ref[];
    tags: Ref[];
    channels: Ref[];
}) {
    return (
        <section className="rounded-2xl border border-border/60 bg-card">
            <div className="border-b border-border/60 px-5 py-4">
                <h2 className="text-sm font-semibold">
                    Organization
                </h2>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Control how this product is organized throughout the catalog.
                </p>
            </div>

            <div className="space-y-5 p-5">
                <FormField
                    field={{
                        name: 'brand_id',
                        label: 'Brand',
                        type: 'select',
                        allowEmpty: true,
                        options: refs(
                            brands,
                        ),
                    }}
                    value={
                        data.brand_id
                    }
                    error={
                        errors.brand_id
                    }
                    onChange={(value) =>
                        setData(
                            'brand_id',
                            value,
                        )
                    }
                />

                <FormField
                    field={{
                        name: 'supplier_id',
                        label: 'Supplier / vendor',
                        type: 'select',
                        allowEmpty: true,
                        options: refs(
                            suppliers,
                        ),
                    }}
                    value={
                        data.supplier_id
                    }
                    error={
                        errors.supplier_id
                    }
                    onChange={(value) =>
                        setData(
                            'supplier_id',
                            value,
                        )
                    }
                />

                <div className="border-t border-dashed border-border/60 pt-5">
                    <MultiCheck
                        label="Categories"
                        items={
                            categories
                        }
                        value={
                            Array.isArray(
                                data.category_ids,
                            )
                                ? data.category_ids
                                : []
                        }
                        error={
                            errors.category_ids
                        }
                        onChange={(
                            value,
                        ) =>
                            setData(
                                'category_ids',
                                value,
                            )
                        }
                    />
                </div>

                <MultiCheck
                    label="Tags"
                    items={tags}
                    value={
                        Array.isArray(
                            data.tag_ids,
                        )
                            ? data.tag_ids
                            : []
                    }
                    error={
                        errors.tag_ids
                    }
                    onChange={(value) =>
                        setData(
                            'tag_ids',
                            value,
                        )
                    }
                />

                <MultiCheck
                    label="Collections"
                    items={
                        collections
                    }
                    value={
                        Array.isArray(
                            data.collection_ids,
                        )
                            ? data.collection_ids
                            : []
                    }
                    error={
                        errors.collection_ids
                    }
                    onChange={(value) =>
                        setData(
                            'collection_ids',
                            value,
                        )
                    }
                />

                <MultiCheck
                    label="Sales channels"
                    items={
                        channels
                    }
                    value={
                        Array.isArray(
                            data.channel_ids,
                        )
                            ? data.channel_ids
                            : []
                    }
                    error={
                        errors.channel_ids
                    }
                    onChange={(value) =>
                        setData(
                            'channel_ids',
                            value,
                        )
                    }
                />
            </div>
        </section>
    );
}