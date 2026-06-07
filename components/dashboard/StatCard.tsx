import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: number | string;
  href?: string;
  description?: string;
}

export function StatCard({ title, value, href, description }: StatCardProps) {
  const content = (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border/80 bg-card p-5 shadow-card transition hover:border-primary/15 hover:shadow-card-hover">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
      <div className="min-h-0 flex-1" aria-hidden />
      {description ? <p className="pt-2 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full min-h-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return <div className="h-full min-h-0">{content}</div>;
}
