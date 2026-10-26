import { Link } from '@inertiajs/react';
import { index as teamsIndex } from '@/routes/teams';

export default function TeamSettings() {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold">
                Teams
            </h2>

            <p className="text-muted-foreground">
                Manage your teams and invitations.
            </p>

            <Link
                href={teamsIndex()}
                className="text-primary underline"
            >
                Open team management
            </Link>
        </section>
    );
}