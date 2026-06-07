'use client';

import { Button } from './Button';

export interface PaginationProps {
  /** Current page (1-based). */
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Show "Showing a–b of n" (default true). */
  showItemRange?: boolean;
  /** aria-label for the nav landmark (default "Pagination"). */
  ariaLabel?: string;
  /** Disable controls (e.g. while data is loading). */
  disabled?: boolean;
}

function buildPageList(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const delta = 1;
  const pages: (number | 'ellipsis')[] = [];
  pages.push(1);
  const left = Math.max(2, current - delta);
  const right = Math.min(totalPages - 1, current + delta);
  if (left > 2) pages.push('ellipsis');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className = '',
  showItemRange = true,
  ariaLabel = 'Pagination',
  disabled = false,
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const totalPages = Math.ceil(totalItems / pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const pageItems = buildPageList(safePage, totalPages);

  return (
    <nav
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
      aria-label={ariaLabel}
      aria-busy={disabled || undefined}
    >
      {showItemRange && (
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">{start}</span>
          {' – '}
          <span className="font-medium text-foreground">{end}</span>
          {' of '}
          <span className="font-medium text-foreground">{totalItems}</span>
        </p>
      )}

      {totalItems > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="Go to previous page"
          >
            Previous
          </Button>

          <ul className="flex flex-wrap items-center gap-1">
            {pageItems.map((item, idx) =>
              item === 'ellipsis' ? (
                <li key={`e-${idx}`} className="px-1.5 text-muted-foreground" aria-hidden>
                  …
                </li>
              ) : (
                <li key={item}>
                  <Button
                    type="button"
                    variant={item === safePage ? 'primary' : 'outline'}
                    size="sm"
                    className="min-w-[2.25rem]"
                    disabled={disabled || totalPages === 1}
                    onClick={() => onPageChange(item)}
                    aria-label={`Go to page ${item}`}
                    aria-current={item === safePage ? 'page' : undefined}
                  >
                    {item}
                  </Button>
                </li>
              )
            )}
          </ul>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="Go to next page"
          >
            Next
          </Button>
        </div>
      )}
    </nav>
  );
}
