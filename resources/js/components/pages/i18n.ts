import type { ContentSection, CptDef, CptDefinition, SectionData } from '@/types/page';

const TEXT_TYPES = ['text', 'textarea', 'wysiwyg'];
const isTranslatable = (f: CptDefinition) => f.translatable ?? TEXT_TYPES.includes(f.type);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const blankRow = (subs: CptDefinition[]): SectionData => {
    const row: SectionData = {};
    subs.forEach((s) => (row[s.name] = s.default_value ?? ''));
    return row;
};

export function emptyData(fields: CptDefinition[]): SectionData {
    const d: SectionData = {};
    fields.forEach((f) => {
        d[f.name] = f.type === 'repeater' ? [] : (f.default_value ?? '');
    });
    return d;
}

export function newSection(group: CptDef, locales: string[], defaultLocale: string, order: number): ContentSection {
    const base = group.is_standalone ? {} : emptyData(group.fields);
    const map: Record<string, SectionData> = {};
    locales.forEach((l) => (map[l] = clone(base)));

    return {
        section_id: undefined,
        cpt_id: group.id,
        cpt_entry_id: null,
        order,
        group_title: group.title,
        group_slug: group.slug,
        data: map[defaultLocale] ?? {},
        locales: map,
    };
}

/** Vista de la sección en el idioma activo (campos vacíos si falta la traducción). */
export function localizeSection(sec: ContentSection, locale: string): ContentSection {
    return { ...sec, data: sec.locales?.[locale] ?? sec.data ?? {} };
}

export function localizeGroup(group: CptDef | undefined, locale: string): CptDef | undefined {
    if (!group) return group;
    return {
        ...group,
        entries: group.entries.map((e) => ({ ...e, data: e.locales?.[locale] ?? e.data })),
    };
}

function firstDiff(prev: any[], cur: any[]): number {
    for (let i = 0; i < cur.length; i++) {
        if (JSON.stringify(prev[i]) !== JSON.stringify(cur[i])) return i;
    }
    return cur.length;
}

/** Copia a otro idioma lo compartido (no traducible) y mantiene alineadas las filas de los repeaters. */
function syncShared(fields: CptDefinition[], prev: SectionData, cur: SectionData, target: SectionData): SectionData {
    const out: SectionData = { ...target };

    for (const f of fields) {
        if (f.type === 'repeater') {
            const subs = f.sub_fields ?? [];
            const prevRows: any[] = prev[f.name] ?? [];
            const curRows: any[] = cur[f.name] ?? [];
            let rows: SectionData[] = [...(target[f.name] ?? [])];

            if (curRows.length < prevRows.length) {
                const removed = firstDiff(prevRows, curRows);
                rows = rows.filter((_, i) => i !== removed);
            }
            while (rows.length < curRows.length) rows.push(blankRow(subs));

            out[f.name] = rows.slice(0, curRows.length).map((row, i) => {
                const r = { ...row };
                subs.forEach((s) => {
                    if (!isTranslatable(s)) r[s.name] = curRows[i]?.[s.name];
                });
                return r;
            });
        } else if (!isTranslatable(f)) {
            out[f.name] = cur[f.name];
        }
    }

    return out;
}

export function applyUpdate(
    sec: ContentSection,
    group: CptDef | undefined,
    active: string,
    data: SectionData,
    locales: string[],
    defaultLocale: string,
): ContentSection {
    const prev = sec.locales?.[active] ?? sec.data ?? {};
    const next: Record<string, SectionData> = { ...(sec.locales ?? {}), [active]: data };

    if (group?.is_standalone && data.cpt_entry_id !== prev.cpt_entry_id) {
        const entry = group.entries.find((e) => e.id === data.cpt_entry_id);
        if (entry?.locales) {
            locales.forEach((l) => {
                next[l] = { ...(entry.locales![l] ?? {}), cpt_entry_id: entry.id };
            });
        }
    } else if (group) {
        locales.forEach((l) => {
            if (l !== active) next[l] = syncShared(group.fields, prev, data, next[l] ?? {});
        });
    }

    return { ...sec, cpt_entry_id: data.cpt_entry_id ?? null, data: next[defaultLocale] ?? data, locales: next };
}