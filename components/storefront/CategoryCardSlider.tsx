'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import type { Category } from '@/types/category';
import { getCategoryImageUrl } from '@/lib/imageUrl';
import { HorizontalSlider } from './HorizontalSlider';

export interface CategoryCardSliderProps {
  categories: Category[];
}

export function CategoryCardSlider({ categories }: CategoryCardSliderProps) {
  if (categories.length === 0) return null;

  const cards = categories.map((category) => {
    const imageUrl = getCategoryImageUrl(category.image);
    return (
      <Link
        key={category.id}
        href={`/shop/category/${category.slug}`}
        className="group block h-full"
      >
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
          <div className="relative mx-1.5 mt-1.5 aspect-square overflow-hidden rounded-lg bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={category.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/15 via-primary/10 to-background">
                <div className="rounded-full bg-primary/10 p-4 text-primary">
                  <ShoppingBag className="h-8 w-8" />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col items-center px-4 pb-5 pt-4 text-center">
            <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground md:text-lg">
              {category.name}
            </h3>
            {category.description ? (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
                {category.description}
              </p>
            ) : null}
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
              Explore Collection
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    );
  });

  return (
    <HorizontalSlider visibleSm={1} visibleLg={3} autoPlayMs={4000}>
      {cards}
    </HorizontalSlider>
  );
}
