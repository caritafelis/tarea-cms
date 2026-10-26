import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Copy, Download, FileText, Loader2, Printer } from 'lucide-react';
import { useState } from 'react';

/* ------------------------------ EAN-13 ------------------------------ */

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

export const checkDigit = (digits: string) => {
    const len = digits.length;

    return (10 - ([...digits].reduce((s, d, i) => s + Number(d) * ((len - i) % 2 === 1 ? 3 : 1), 0) % 10)) % 10;
};

/** GTIN válido (8, 12, 13 o 14 dígitos) con su dígito de control. */
export const gtinValid = (raw: string) => /^(\d{8}|\d{12,14})$/.test(raw) && checkDigit(raw.slice(0, -1)) === Number(raw.slice(-1));

/** UPC-A (12) se imprime como EAN-13 con un 0 delante. Devuelve null si no es imprimible. */
export const normalizeEan = (raw: string): string | null => {
    const d = raw.replace(/\D/g, '');
    const full = d.length === 12 ? `0${d}` : d;

    return full.length === 13 && checkDigit(full.slice(0, 12)) === Number(full[12]) ? full : null;
};

export function ean13Svg(code: string, { height = 56, showText = true }: { height?: number; showText?: boolean } = {}): string | null {
    const ean = normalizeEan(code);
    if (!ean) return null;

    const parity = PARITY[Number(ean[0])];
    let bits = '101';
    for (let i = 0; i < 6; i++) bits += (parity[i] === 'L' ? L : G)[Number(ean[i + 1])];
    bits += '01010';
    for (let i = 0; i < 6; i++) bits += R[Number(ean[i + 7])];
    bits += '101';

    const qz = 11;
    const width = 95 + qz + 7;
    const guardH = height + 6;
    const total = guardH + (showText ? 12 : 2);
    const isGuard = (i: number) => i < 3 || (i >= 45 && i < 50) || i >= 92;

    let rects = '';
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] === '1') rects += `<rect x="${qz + i}" y="0" width="1" height="${isGuard(i) ? guardH : height}"/>`;
    }

    let text = '';
    if (showText) {
        const t = (x: number, c: string) => `<text x="${x}" y="${guardH + 9}" text-anchor="middle">${c}</text>`;
        text += t(qz / 2, ean[0]);
        for (let i = 0; i < 6; i++) text += t(qz + 3 + i * 7 + 3.5, ean[i + 1]);
        for (let i = 0; i < 6; i++) text += t(qz + 50 + i * 7 + 3.5, ean[i + 7]);
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${total}" role="img" aria-label="Barcode ${ean}"><rect width="${width}" height="${total}" fill="#fff"/><g fill="#000">${rects}</g><g fill="#000" font-family="Arial,Helvetica,monospace" font-size="9">${text}</g></svg>`;
}

/* ------------------------------ Tarjeta ------------------------------ */

export function BarcodeCard({ value, canPrint, onPrint }: { value?: string | null; canPrint?: boolean; onPrint?: () => void }) {
    const [copied, setCopied] = useState(false);

    if (!value) {
        return (
            <div className="rounded-md border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
                Generated automatically when you save the product.
            </div>
        );
    }

    const svg = ean13Svg(value);

    return (
        <div className="flex items-center gap-4 rounded-md border bg-muted/20 p-3">
            {svg ? (
                <div className="w-36 shrink-0 overflow-hidden rounded bg-white p-1" dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
                <code className="text-sm">{value}</code>
            )}

            <div className="min-w-0 space-y-2">
                <code className="block truncate text-sm font-medium">{value}</code>
                <div className="flex flex-wrap gap-2">
                    {canPrint && (
                        <Button type="button" size="sm" variant="outline" onClick={onPrint}>
                            <Printer className="mr-1.5 size-3.5" /> Labels
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            void navigator.clipboard?.writeText(value);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                        }}
                    >
                        {copied ? <Check className="mr-1.5 size-3.5" /> : <Copy className="mr-1.5 size-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ------------------- Etiqueta: raster (PNG) y PDF propios ------------------- */

export type LabelItem = { key: string; label: string; sku?: string | null; barcode: string; price?: string | null };

const SIZES = [
    { key: '50x25', label: '50 × 25 mm', w: 50, h: 25 },
    { key: '62x29', label: '62 × 29 mm', w: 62, h: 29 },
    { key: '100x50', label: '100 × 50 mm', w: 100, h: 50 },
];

const DPI = 300;
const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI);
const ptToPx = (pt: number) => (pt / 72) * DPI;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Dibuja la etiqueta a 300 DPI. */
async function renderLabel(item: LabelItem, dim: { w: number; h: number }, showPrice: boolean): Promise<HTMLCanvasElement> {
    const W = mmToPx(dim.w);
    const H = mmToPx(dim.h);
    const pad = mmToPx(2);

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'top';

    // Nombre: máximo 2 líneas.
    const nameSize = ptToPx(7);
    ctx.font = `700 ${nameSize}px Arial, Helvetica, sans-serif`;
    const lines: string[] = [];
    let current = '';
    for (const word of item.label.split(/\s+/)) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > W - pad * 2 && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    const shown = lines.slice(0, 2);
    if (lines.length > 2) shown[1] = `${shown[1].replace(/\s*\S*$/, '')}…`;
    shown.forEach((line, i) => ctx.fillText(line, pad, pad + i * nameSize * 1.15));

    // Fila inferior: SKU a la izquierda, precio a la derecha.
    const metaSize = ptToPx(6.5);
    ctx.font = `${metaSize}px Arial, Helvetica, sans-serif`;
    const metaY = H - pad - metaSize;
    if (item.sku) ctx.fillText(item.sku, pad, metaY);
    if (showPrice && item.price) {
        ctx.textAlign = 'right';
        ctx.fillText(item.price, W - pad, metaY);
        ctx.textAlign = 'left';
    }

    // Barras en el espacio central.
    const top = pad + shown.length * nameSize * 1.15 + mmToPx(0.8);
    const barsW = W - pad * 2;
    const barsH = Math.max(10, metaY - top - mmToPx(0.5));
    const svg = ean13Svg(item.barcode, { height: 50 });

    if (svg) {
        const sized = svg.replace('<svg ', `<svg width="${barsW}" height="${barsH}" preserveAspectRatio="xMidYMid meet" `);
        const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Could not render the barcode.'));
            img.src = url;
        });
        URL.revokeObjectURL(url);
        ctx.drawImage(img, pad, top, barsW, barsH);
    } else {
        ctx.font = `700 ${ptToPx(9)}px monospace`;
        ctx.fillText(item.barcode, pad, top);
    }

    return canvas;
}

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
    new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed.'))), type, quality));

/** PDF mínimo con una imagen JPEG por página (una página por copia). Sin librerías. */
function buildPdf(jpeg: Uint8Array, pxW: number, pxH: number, wMm: number, hMm: number, copies: number): Blob {
    const enc = new TextEncoder();
    const parts: Uint8Array[] = [];
    const offsets: number[] = [];
    let length = 0;

    const push = (d: string | Uint8Array) => {
        const bytes = typeof d === 'string' ? enc.encode(d) : d;
        parts.push(bytes);
        length += bytes.length;
    };
    const begin = (n: number) => {
        offsets[n] = length;
        push(`${n} 0 obj\n`);
    };

    const wPt = ((wMm / 25.4) * 72).toFixed(2);
    const hPt = ((hMm / 25.4) * 72).toFixed(2);
    const content = `q ${wPt} 0 0 ${hPt} 0 0 cm /Im0 Do Q`;
    const firstPage = 5;
    const kids = Array.from({ length: copies }, (_, i) => `${firstPage + i} 0 R`).join(' ');

    push('%PDF-1.4\n');
    begin(1); push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    begin(2); push(`<< /Type /Pages /Kids [${kids}] /Count ${copies} >>\nendobj\n`);
    begin(3);
    push(`<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    push(jpeg);
    push('\nendstream\nendobj\n');
    begin(4); push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);

    for (let i = 0; i < copies; i++) {
        begin(firstPage + i);
        push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Resources << /XObject << /Im0 3 0 R >> >> /Contents 4 0 R >>\nendobj\n`);
    }

    const count = firstPage + copies;
    const xref = length;
    push(`xref\n0 ${count}\n0000000000 65535 f \n`);
    for (let n = 1; n < count; n++) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`);
    push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);

    return new Blob(parts as BlobPart[], { type: 'application/pdf' });
}

function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** El navegador solo puede llegar a una impresora a través de su ventana de impresión del sistema. */
function systemPrint(html: string) {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(frame);

    const doc = frame.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
    }, 250);
    setTimeout(() => frame.remove(), 60_000);
}

/* ----------------------------- Diálogo de etiquetas ----------------------------- */

export function BarcodeLabelDialog({ open, onOpenChange, items }: { open: boolean; onOpenChange: (v: boolean) => void; items: LabelItem[] }) {
    const [itemKey, setItemKey] = useState('');
    const [size, setSize] = useState('50x25');
    const [copies, setCopies] = useState(1);
    const [showPrice, setShowPrice] = useState(true);
    const [busy, setBusy] = useState<'pdf' | 'png' | null>(null);
    const [error, setError] = useState<string | null>(null);

    const item = items.find((i) => i.key === itemKey) ?? items[0];
    const dim = SIZES.find((s) => s.key === size)!;
    if (!item) return null;

    const svg = ean13Svg(item.barcode, { height: 50 });
    const fileBase = `label-${(item.sku || item.barcode).replace(/[^a-z0-9_-]/gi, '')}`;

    async function run(kind: 'pdf' | 'png') {
        setBusy(kind);
        setError(null);

        try {
            const canvas = await renderLabel(item, dim, showPrice);

            if (kind === 'png') {
                saveBlob(await canvasToBlob(canvas, 'image/png'), `${fileBase}.png`);
            } else {
                const jpeg = new Uint8Array(await (await canvasToBlob(canvas, 'image/jpeg', 0.95)).arrayBuffer());
                saveBlob(buildPdf(jpeg, canvas.width, canvas.height, dim.w, dim.h, Math.max(1, copies)), `${fileBase}.pdf`);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'We could not create the file.');
        } finally {
            setBusy(null);
        }
    }

    function print() {
        const label = `<div class="label"><div class="name">${esc(item.label)}</div><div class="bars">${svg ?? `<b>${esc(item.barcode)}</b>`}</div><div class="meta"><span>${esc(item.sku ?? '')}</span><span>${showPrice && item.price ? esc(item.price) : ''}</span></div></div>`;

        systemPrint(`<!doctype html><html><head><meta charset="utf-8"><title>Labels</title><style>
@page{size:${dim.w}mm ${dim.h}mm;margin:0}
*{box-sizing:border-box}
body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#000}
.label{width:${dim.w}mm;height:${dim.h}mm;padding:1.5mm 2mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;overflow:hidden}
.label:last-child{page-break-after:auto}
.name{font-size:7pt;font-weight:700;line-height:1.1;max-height:2.2em;overflow:hidden}
.meta{font-size:6.5pt;display:flex;justify-content:space-between}
.bars{flex:1;min-height:0;display:flex;align-items:center;justify-content:center}
.bars svg{width:100%;height:100%}
</style></head><body>${label.repeat(Math.max(1, copies))}</body></html>`);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Barcode labels</DialogTitle>
                    <DialogDescription>Choose the size of your label roll, preview it and download it ready to print.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {items.length > 1 && (
                        <div className="space-y-1.5">
                            <Label>Item</Label>
                            <Select value={item.key} onValueChange={setItemKey}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{items.map((i) => <SelectItem key={i.key} value={i.key}>{i.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Label size</Label>
                            <Select value={size} onValueChange={setSize}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{SIZES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="label-copies">Copies</Label>
                            <Input id="label-copies" type="number" min={1} max={500} value={copies} onChange={(e) => setCopies(Math.min(500, Math.max(1, Number(e.target.value) || 1)))} />
                        </div>
                    </div>

                    {item.price && (
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} /> Show price on the label
                        </label>
                    )}

                    <div className="flex justify-center rounded-lg bg-muted/40 p-4">
                        <div className="flex flex-col justify-between border bg-white p-1.5 text-black shadow-sm" style={{ width: dim.w * 3.2, height: dim.h * 3.2 }}>
                            <p className="line-clamp-2 text-[9px] font-bold leading-tight">{item.label}</p>
                            <div className="flex min-h-0 flex-1 items-center justify-center [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg ?? '' }} />
                            <div className="flex justify-between text-[8px]">
                                <span>{item.sku}</span>
                                <span>{showPrice ? item.price : ''}</span>
                            </div>
                        </div>
                    </div>

                    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                    <p className="text-xs text-muted-foreground">
                        The PDF contains one page per copy at the exact label size: open it in any printer or label software. “Print” uses your system’s print window.
                    </p>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button type="button" variant="outline" onClick={print}><Printer className="mr-2 size-4" /> Print</Button>
                    <Button type="button" variant="outline" disabled={busy !== null} onClick={() => run('png')}>
                        {busy === 'png' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />} PNG
                    </Button>
                    <Button type="button" disabled={busy !== null} onClick={() => run('pdf')}>
                        {busy === 'pdf' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileText className="mr-2 size-4" />} Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}