import MediaPicker from '@/components/media/media-picker';
import { MediaItem } from '@/types/media';
import { Button } from '@/components/ui/button';

interface Props {
    value: MediaItem | null;
    onChange: (media: MediaItem | null) => void;
}

export default function ImageField({
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
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onChange(null)}
                >
                    Remove Image
                </Button>
            )}
        </div>
    );
}