import { CategoryCardSlider } from '@/components/storefront';
import { Container } from '@/components/ui';
import type { Category } from '@/types/category';
import { SectionHeading } from './SectionHeading';

interface FeaturedCategoriesSectionProps {
  categories: Category[];
}

export function FeaturedCategoriesSection({ categories }: FeaturedCategoriesSectionProps) {
  if (categories.length === 0) return null;

  return (
    <section className="border-y border-border/50 bg-gradient-to-b from-muted/25 to-background ">
      <Container size="lg" className="py-12 md:py-20">
        <SectionHeading
          eyebrow="Categories"
          title="Shop by Category"
          description="Explore our curated collection of premium digital products"
        />
        <CategoryCardSlider categories={categories} />
      </Container>
    </section>
  );
}
