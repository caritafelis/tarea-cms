export const LANG_LABELS: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    nl: 'Nederlands',
    ru: 'Русский',
    zh: '中文',
    ja: '日本語',
    ko: '한국어',
    ar: 'العربية',
};

export const getTranslation = (field: any, lang: string): string => {
    if (!field) return '';
    if (typeof field === 'string') {
        try {
            const p = JSON.parse(field);
            return p[lang] || p['en'] || '';
        } catch {
            return field;
        }
    }
    return field[lang] || field['en'] || '';
};