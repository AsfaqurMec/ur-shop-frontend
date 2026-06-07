import Link from 'next/link';

export interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  footer?: React.ReactNode;
}

export function AuthCard({
  title,
  description,
  children,
  backHref = '/',
  backLabel = 'Back to home',
  footer,
}: AuthCardProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-card sm:p-8 md:p-10">
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <span aria-hidden>←</span>
        {backLabel}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      <div className="mt-8">{children}</div>
      {footer && (
        <div className="mt-8 border-t border-border/80 pt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}
