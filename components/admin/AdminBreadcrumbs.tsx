'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Dashboard',
  products: 'Products',
  categories: 'Categories',
  orders: 'Orders',
  customers: 'Customers',
  coupons: 'Coupons',
  trending: 'Trending Products',
  reviews: 'Reviews',
  tickets: 'Tickets',
  settings: 'Store Settings',
  admins: 'Admins',
  'payment-options': 'Payment Options',
  'email-logs': 'Email Logs',
  new: 'Create New',
  edit: 'Edit',
};

function formatSegment(segment: string, prevSegment?: string): string {
  if (ROUTE_LABELS[segment]) return ROUTE_LABELS[segment];
  if (/^\d+$/.test(segment)) {
    if (prevSegment === 'orders') return `Order #${segment}`;
    if (prevSegment === 'products') return `Product #${segment}`;
    if (prevSegment === 'categories') return `Category #${segment}`;
    if (prevSegment === 'coupons') return `Coupon #${segment}`;
    if (prevSegment === 'tickets') return `Ticket #${segment}`;
    if (prevSegment === 'customers') return `Customer #${segment}`;
    return `#${segment}`;
  }
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  if (!pathname || !pathname.startsWith('/admin')) return null;

  const rawSegments = pathname.split('/').filter(Boolean);
  // Example: ['admin'] or ['admin', 'products', 'new']
  
  const crumbs = rawSegments.map((segment, idx) => {
    const href = '/' + rawSegments.slice(0, idx + 1).join('/');
    const prevSegment = idx > 0 ? rawSegments[idx - 1] : undefined;
    const label = formatSegment(segment, prevSegment);
    const isLast = idx === rawSegments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link
        href="/admin"
        className="flex items-center gap-1 font-medium transition-colors hover:text-foreground"
      >
        <svg
          className="h-3.5 w-3.5 text-muted-foreground/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <span>Admin</span>
      </Link>

      {crumbs.slice(1).map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-1.5">
          <svg
            className="h-3 w-3 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {crumb.isLast ? (
            <span className="font-semibold text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="font-medium transition-colors hover:text-foreground"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
