import React from 'react';
import { Head, router } from '@inertiajs/react';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { index as pagesIndex } from '@/routes/admin/pages';
import PageEditor from './page-editor';
import { PageItem, CptDef } from '@/types/page';

interface Props {
    page: PageItem;
    locales: string[];
    defaultLocale: string;
    availableGroups: CptDef[];
}

export default function Edit({
    page,
    locales,
    defaultLocale,
    availableGroups,
}: Props) {
    const teamSlug = useTeamSlug();

    return (
        <>
            <Head title={`Edit a ${page.slug}`} />

            <PageEditor
                page={page}
                locales={locales}
                defaultLocale={defaultLocale}
                availableGroups={availableGroups}
                onClose={() => router.visit(pagesIndex.url(teamSlug))}
            />
        </>
    );
}

Edit.layout = (page: any) => {
    const slug = page.props?.currentTeam?.slug as string | undefined;

    return {
        breadcrumbs: [
            { title: 'Pages', href: pagesIndex.url(slug) },
            { title: 'Edit Page', href: '#' },
        ],
        children: page,
    };
};