import React from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  return (
    <div className="rounded-lg border border-sidebar-border/70 bg-white/50 p-2 backdrop-blur-md dark:bg-black/50">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-sidebar-border/50 pb-2 mb-2 text-sm text-neutral-600 dark:text-neutral-400">
        <button type="button" className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-bold">B</button>
        <button type="button" className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded italic">I</button>
        <button type="button" className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded underline">U</button>
        <div className="w-px h-4 bg-sidebar-border self-center mx-1" />
        <button type="button" className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">H1</button>
        <button type="button" className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">H2</button>
        <button type="button" className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">Quote</button>
        <button type="button" className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">Code</button>
      </div>
      {/* Editor Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        className="w-full bg-transparent resize-y border-0 p-2 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-200 text-sm font-sans"
      />
    </div>
  );
}
