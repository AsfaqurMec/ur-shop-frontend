/** Compact count pill for sidebar nav items (e.g. open tickets, cart). */
export function NavCountBadge({ count, ariaLabel }: { count: number; ariaLabel: string }) {
  if (count <= 0) return null;
  const display = Math.min(count, 99);
  return (
    <span
      className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground"
      aria-label={ariaLabel}
    >
      {display}
    </span>
  );
}
