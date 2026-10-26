import { ContentSection } from '@/types/page';

export interface PostItem {
    id: number;
    [key: string]: any;
    slug: string;
    status: string;
    created_at: string;
    sections?: ContentSection[];
}