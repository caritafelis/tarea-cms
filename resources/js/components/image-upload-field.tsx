import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';

type Props = {
    /** Nombre del campo que recibe Laravel (logo / avatar). */
    name: string;
    /** Nombre de la entidad, para las iniciales de fallback. */
    label: string;
    /** URL actual de la imagen (logo_url / avatar_url). */
    currentUrl?: string | null;
    /** Nombre del campo que indica "borrar imagen" (ej. remove_logo). */
    removeName?: string;
    /** Para usarlo con useForm: recibe el File seleccionado (o null). */
    onChange?: (file: File | null) => void;
    onRemove?: () => void;
};

/**
 * Funciona dentro de <Form> de Inertia (el input name="..." viaja solo)
 * y también controlado con useForm mediante onChange.
 */
export default function ImageUploadField({
    name,
    label,
    currentUrl,
    removeName,
    onChange,
    onRemove,
}: Props) {
    const getInitials = useInitials();
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [removed, setRemoved] = useState(false);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const src = removed ? null : (preview ?? currentUrl ?? null);

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;

        setPreview(file ? URL.createObjectURL(file) : null);
        setRemoved(false);
        onChange?.(file);
    }

    function handleRemove() {
        if (inputRef.current) inputRef.current.value = '';
        setPreview(null);
        setRemoved(true);
        onChange?.(null);
        onRemove?.();
    }

    return (
        <div className="flex items-center gap-4">
            <Avatar className="size-14 rounded-xl border border-border">
                {src ? (
                    <AvatarImage src={src} alt={label} className="rounded-xl object-cover" />
                ) : null}
                <AvatarFallback className="rounded-xl bg-muted text-lg font-semibold text-muted-foreground">
                    {getInitials(label)}
                </AvatarFallback>
            </Avatar>

            <div className="flex gap-2">
                <input
                    ref={inputRef}
                    type="file"
                    name={name}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="sr-only"
                    onChange={handleFile}
                />
                {removeName && removed ? (
                    <input type="hidden" name={removeName} value="1" />
                ) : null}

                <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                    {src ? 'Change' : 'Upload'}
                </Button>
                {src ? (
                    <Button type="button" size="sm" variant="ghost" onClick={handleRemove}>
                        Remove
                    </Button>
                ) : null}
            </div>
        </div>
    );
}