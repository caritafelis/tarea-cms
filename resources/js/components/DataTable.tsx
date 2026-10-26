import React, { useState } from 'react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: (item: T) => string;
}

export default function DataTable<T>({ data, columns, searchPlaceholder = "Search...", searchKey }: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = data.filter(item => {
    if (!searchQuery || !searchKey) return true;
    return searchKey(item).toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-full space-y-4">
      {searchKey && (
        <div className="flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="max-w-sm rounded-lg border border-sidebar-border/70 bg-white/50 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sidebar-border dark:bg-black/50"
          />
        </div>
      )}
      
      <div className="rounded-xl border border-sidebar-border/70 bg-white/30 backdrop-blur-md overflow-hidden dark:bg-black/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-sidebar-border/70 bg-sidebar-border/30 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sidebar-border/70 text-sm text-neutral-700 dark:text-neutral-300">
            {filteredData.length > 0 ? (
              filteredData.map((item, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-sidebar-border/10 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 whitespace-nowrap">{col.accessor(item)}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-neutral-400">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
