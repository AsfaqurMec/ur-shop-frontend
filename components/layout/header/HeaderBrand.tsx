import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/types/category';

interface HeaderBrandProps {
  brandName: string;
  brandLogo: string;
  onNavigate?: () => void;
}

export function HeaderBrand({ brandName, brandLogo, onNavigate }: HeaderBrandProps) {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-foreground"
      onClick={onNavigate}
    >
      <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-border" aria-hidden>
        <Image src={brandLogo} alt="" width={36} height={36} className="object-contain" priority unoptimized />
      </span>
      <span className="hidden sm:inline">{brandName}</span>
    </Link>
  );
}

interface HeaderCategoryNavProps {
  pathname: string;
  navCategories: Category[];
}

export function HeaderCategoryNav({ pathname, navCategories }: HeaderCategoryNavProps) {
  return (
    <nav className="hidden md:flex flex-1 items-center justify-center gap-0.5 overflow-x-auto px-2" aria-label="Categories">
      <Link
        href="/shop"
        className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          pathname === '/shop'
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        All
      </Link>
      {navCategories.map((category) => {
        const href = `/shop/category/${category.slug}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={category.id}
            href={href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {category.name}
          </Link>
        );
      })}
    </nav>
  );
}
