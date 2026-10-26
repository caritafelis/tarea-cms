import React from 'react';
import { Head, router } from '@inertiajs/react';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { index as postsIndex } from '@/routes/admin/posts';
import { CptDef } from '@/types/page';
import PostEditor from './post-editor';

interface Props {
    locales: string[];
    defaultLocale: string;
    availableGroups: CptDef[];
}

export default function Create({
    locales,
    defaultLocale,
    availableGroups,
}: Props) {
    const teamSlug = useTeamSlug();

    return (
        <>
            <Head title="Create Post" />

            <PostEditor
                post={null}
                locales={locales}
                defaultLocale={defaultLocale}
                availableGroups={availableGroups}
                onClose={() => router.visit(postsIndex.url(teamSlug))}
            />
        </>
    );
}

Create.layout = () => ({
    breadcrumbs: [
        { title: 'Posts', href: '/admin/posts' },
        { title: 'Create Post', href: '#' },
    ],
});