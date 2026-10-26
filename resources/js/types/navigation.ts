import { IconSvgElement } from '@hugeicons/react';
import type { InertiaLinkProps } from '@inertiajs/react';

export type IsActiveFn = (href: LinkHref) => boolean;

export type LinkHref = NonNullable<InertiaLinkProps['href']>;

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    icon?: IconSvgElement | null;
    isActive?: boolean;
} & (
        | { href: LinkHref; onClick?: never }
        | { onClick: () => void; href?: never }
    );