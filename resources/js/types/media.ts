export interface MediaItem {
    id: number;
    folder_id: number | null;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    custom_properties: CustomProperties;
    original_url: string;
    thumb_url?: string;
    large_url?: string;
    webp_url?: string;
}

export interface UploadingMedia {
    id: string;
    uploading: true;
    progress: number;
    preview: string;
    folder_id: number | null;
    custom_properties: CustomProperties;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    original_url: string;
    thumb_url?: string;
}

export type MediaItems =
    | MediaItem
    | UploadingMedia;

export interface MediaFolder {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    children?: MediaFolder[];
}

export interface MediaFolder {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    children?: MediaFolder[];
}

export interface MediaPaginated {
    data: MediaItem[];
    current_page: number;
    last_page: number;
    total: number;
}

export interface CustomProperties {
    alt?: string;
    title?: string;
    caption?: string;
    description?: string;
}