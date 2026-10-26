
import { LinkHref } from '@/resources/js/types/navigation';
import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}


export function hrefToString(href: LinkHref): string {
    if (typeof href === 'string') {
        return href;
    }
    if ('url' in href) {
        return href.url;
    }
    return '';
}
