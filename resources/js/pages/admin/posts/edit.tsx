import React from 'react';
import { Head, router } from '@inertiajs/react';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { index as postsIndex } from '@/routes/admin/posts';
import { CptDef } from '@/types/page';
import { PostItem } from '@/types/post';
import PostEditor from './post-editor';

interface Props {
    post: PostItem;
    locales: string[];
    defaultLocale: string;
    availableGroups: CptDef[];
}

export default function Edit({
    post,
    locales,
    defaultLocale,
    availableGroups,
}: Props) {
    const teamSlug = useTeamSlug();

    return (
        <>
            <Head title={`Edit ${post.slug}`} />

            <PostEditor
                post={post}
                locales={locales}
                defaultLocale={defaultLocale}
                availableGroups={availableGroups}
                onClose={() => router.visit(postsIndex.url(teamSlug))}
            />
        </>
    );
}

Edit.layout = (page: any) => {
    const slug = page.props?.currentTeam?.slug as string | undefined;

    return {
        breadcrumbs: [
            { title: 'Posts', href: postsIndex.url(slug) },
            { title: 'Edit Post', href: '#' },
        ],
        children: page,
    };
};