import MediaPicker from '@/components/media/media-picker';
import { MediaItem } from '@/types/media';
import { Button } from '@/components/ui/button';

interface Props {
    value: MediaItem | null;
    onChange: (media: MediaItem | null) => void;
}

export default function FileField({
    value,
    onChange,
}: Props) {
    return (
        <div className="space-y-4">
            <MediaPicker
                value={value}
                onChange={onChange}
            />

            {value && (
                <div className="rounded-lg border p-4">
                    <div className="font-medium">
                        {value.name}
                    </div>

                    <div className="text-sm text-muted-foreground">
                        {value.file_name}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {(
                            value.size / 1024 / 1024
                        ).toFixed(2)} MB
                    </div>

                    <Button
                        asChild
                        variant="link"
                        className="p-0 h-auto"
                    >
                        <a
                            href={value.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View File
                        </a>
                    </Button>
                </div>
            )}

            {value && (
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onChange(null)}
                >
                    Remove File
                </Button>
            )}
        </div>
    );
}