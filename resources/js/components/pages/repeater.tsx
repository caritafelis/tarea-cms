import React from 'react';
import { Trash2 } from 'lucide-react';
import { CptDefinition, SectionData } from '@/types/page';
import FieldInput from './field-input';

interface RepeaterProps {
    subCpts: CptDefinition[];
    row: SectionData;
    rowIndex: number;
    onChange: (key: string, v: any) => void;
    onRemove: () => void;
}

export default function Repeater({ subCpts, row, rowIndex, onChange, onRemove }: RepeaterProps) {
    return (
        <div className="rounded-lg border border-sidebar-border/50 bg-neutral-50 dark:bg-neutral-800/50 p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Row {rowIndex + 1}
                </span>
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-red-400 hover:text-red-600 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {subCpts.map(sf => (
                <div key={sf.id}>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        {sf.label}
                        {sf.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <FieldInput field={sf} value={row[sf.name]} onChange={v => onChange(sf.name, v)} />
                </div>
            ))}
        </div>
    );
}