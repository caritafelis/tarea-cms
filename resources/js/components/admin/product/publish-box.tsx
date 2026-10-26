import { FormField } from '@/components/admin/form-fields';
import { Button } from '@/components/ui/button';
import { localNow, statusOf, type PubStatus } from './product-utils';

type Patch = { is_visible?: boolean; published_at?: string; featured?: boolean };

/** Caja "Publish" estilo WooCommerce: estado, fecha, destacado y acciones. */
export function PublishBox({
    isVisible, publishedAt, featured, onChange, onSave, saving, dirty, saveLabel = 'Update', onTrash,
}: {
    isVisible: boolean; publishedAt: string; featured: boolean;
    onChange: (patch: Patch) => void;
    onSave: () => void; saving?: boolean; dirty?: boolean; saveLabel?: string; onTrash?: () => void;
}) {
    const status = statusOf(isVisible, publishedAt);

    const setStatus = (s: PubStatus) => {
        if (s === 'draft') onChange({ is_visible: false });
        else if (s === 'published') onChange({ is_visible: true, published_at: !publishedAt || new Date(publishedAt) > new Date() ? localNow() : publishedAt });
        else onChange({ is_visible: true, published_at: publishedAt && new Date(publishedAt) > new Date() ? publishedAt : localNow(1) });
    };

    return (
        <div className="space-y-4 rounded-2xl border border-border/60 p-5">
            <h2 className="text-base font-semibold">Publish</h2>
            <FormField
                field={{
                    name: 'status', label: 'Status', type: 'select', options: [
                        { value: 'draft', label: 'Draft (hidden)' }, { value: 'published', label: 'Published' }, { value: 'scheduled', label: 'Scheduled' },
                    ]
                }}
                value={status} onChange={(v) => setStatus(v as PubStatus)}
            />
            {status !== 'draft' && (
                <FormField
                    field={{ name: 'published_at', label: status === 'scheduled' ? 'Publish on' : 'Published on', type: 'datetime-local' }}
                    value={publishedAt} onChange={(v) => onChange({ published_at: v })}
                />
            )}
            <FormField field={{ name: 'featured', label: 'Featured product', type: 'switch' }} value={featured} onChange={(v) => onChange({ featured: v })} />
            <div className="flex items-center justify-between gap-2 border-t border-dashed border-border/60 pt-4">
                {onTrash ? <button type="button" onClick={onTrash} className="text-sm text-destructive hover:underline">Move to trash</button> : <span />}
                <Button type="button" onClick={onSave} disabled={saving || dirty === false}>{saving ? 'Saving…' : saveLabel}</Button>
            </div>
        </div>
    );
}