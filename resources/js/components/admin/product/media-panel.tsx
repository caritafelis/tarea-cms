import { router } from '@inertiajs/react';
import { Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import productRoutes from '@/actions/App/Http/Controllers/Admin/ProductController';
import { Muted } from '@/components/admin/cells';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfirm } from '@/components/confirm/confirm-provider';

export type MediaItem = { id: number; collection: string; name: string; url: string; mime: string | null };

const COLLECTIONS = [
    { value: 'thumbnail', label: 'Thumbnail' },
    { value: 'gallery', label: 'Gallery' },
    { value: 'files', label: 'Files' },
];

export function MediaPanel({ productId, team, media }: { productId: number; team: string; media: MediaItem[] }) {
    const [collection, setCollection] = useState('gallery');
    const [busy, setBusy] = useState(false);
    const input = useRef<HTMLInputElement>(null);
    const confirm = useConfirm();

    const upload = (file?: File) => {
        if (!file) return;
        router.post(productRoutes.uploadMedia.url({ current_team: team, product: productId }), { file, collection }, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => { setBusy(false); if (input.current) input.current.value = ''; },
        });
    };

    const remove = async (m: MediaItem) => {
        const ok = await confirm({
            title: `Delete “${m.name}”?`,
            description: 'This media file will no longer be visible to customers.',
            confirmLabel: 'Delete file',
            destructive: true,
        });
        if (!ok) return;

        router.delete(productRoutes.destroyMedia.url({ current_team: team, product: productId, media: m.id }), { preserveScroll: true });
    };
    return (
        <Card>
            <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={collection} onValueChange={setCollection}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>{COLLECTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <input ref={input} type="file" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
                    <Button type="button" disabled={busy} onClick={() => input.current?.click()}>
                        <Upload className="mr-1 h-4 w-4" />{busy ? 'Uploading…' : 'Upload file'}
                    </Button>
                    <Muted>Max 10 MB</Muted>
                </div>

                {media.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No media yet.</p>}
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {media.map((m) => (
                        <div key={m.id} className="group relative overflow-hidden rounded-lg border">
                            {m.mime?.startsWith('image/') ? (
                                <img src={m.url} alt={m.name} className="aspect-square w-full object-cover" />
                            ) : (
                                <div className="flex aspect-square items-center justify-center p-2 text-center text-xs text-muted-foreground">{m.name}</div>
                            )}
                            <div className="flex items-center justify-between gap-1 border-t p-2">
                                <Muted className="truncate capitalize">{m.collection}</Muted>
                                <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(m)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}