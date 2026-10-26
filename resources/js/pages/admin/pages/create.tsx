import { Head, router } from '@inertiajs/react';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { index as pagesIndex } from '@/routes/admin/pages';
import type { CptDef } from '@/types/page';
import PageEditor from './page-editor';

interface Props {
    locales: string[];
    defaultLocale: string;
    availableGroups: CptDef[];
}

export default function Create({ locales, defaultLocale, availableGroups }: Props) {
    const teamSlug = useTeamSlug();

    return (
        <>
            <Head title="Add New Page" />
            <PageEditor
                page={null}
                locales={locales}
                defaultLocale={defaultLocale}
                availableGroups={availableGroups}
                onClose={() => router.visit(pagesIndex.url(teamSlug))}
            />
        </>
    );
}

Create.layout = (page: any) => {
    const slug = page.props?.currentTeam?.slug as string | undefined;

    return {
        breadcrumbs: [
            { title: 'Pages', href: pagesIndex.url(slug) },
            { title: 'Add New', href: '#' },
        ],
        children: page,
    };
};