import { normalize } from '@/routes/admin/currencies';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export function NormalizeButton() {
    const { props } = usePage();
    const teamSlug = (props as any).currentTeam.slug;
    const [loading, setLoading] = useState(false);

    const handleNormalize = () => {
        if (confirm('Do you wish to correct the amounts of your affected records?')) {
            setLoading(true);
            router.post(normalize({ current_team: teamSlug }).url, {}, {
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            });
        }
    };

    return (
        <button
            onClick={handleNormalize}
            disabled={loading}
            className="btn-primary"
        >
            {loading ? 'Procesando...' : 'Normalize Affected Records'}
        </button>
    );
}