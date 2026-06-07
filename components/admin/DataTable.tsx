'use client';

import { Fragment, type ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
  className?: string;
  /** Alternating row backgrounds (zebra striping). */
  striped?: boolean;
  /** Full-width row below the data row when the callback returns content (e.g. expand details). */
  renderSubRow?: (row: T) => ReactNode | null;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data',
  className = '',
  striped = false,
  renderSubRow,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div
        className={`rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground ${className}`}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={`-mx-4 min-w-0 overflow-x-auto overscroll-x-contain rounded-none border-x-0 border-y border-border/80 bg-card shadow-card sm:mx-0 sm:rounded-xl sm:border ${className}`}
    >
      <table className="w-full min-w-max text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border/80 bg-muted/40">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`whitespace-nowrap px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-4 sm:py-3.5 sm:text-xs ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const sub = renderSubRow?.(row) ?? null;
            return (
              <Fragment key={keyExtractor(row)}>
                <tr
                  className={`border-b border-border/60 transition-colors hover:bg-muted/30 ${
                    sub ? '' : 'last:border-0'
                  } ${striped ? (index % 2 === 0 ? 'bg-background' : 'bg-muted/25') : ''}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`break-words px-2 py-2.5 text-foreground sm:px-4 sm:py-3.5 ${col.className ?? ''}`}
                    >
                      {col.render
                        ? col.render(row)
                        : (row as Record<string, unknown>)[col.key] != null
                          ? String((row as Record<string, unknown>)[col.key])
                          : '—'}
                    </td>
                  ))}
                </tr>
                {sub ? (
                  <tr className="border-b border-border/60 last:border-0 bg-muted/15">
                    <td colSpan={columns.length} className="px-2 py-3 sm:px-4 sm:py-4">
                      {sub}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
