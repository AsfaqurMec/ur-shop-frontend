import { ProductGrid } from '@/components/storefront';
import { Container } from '@/components/ui';
import type { Product } from '@/types/product';
import { SectionHeading } from './SectionHeading';

interface TrendingProductsSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  addingProductId: number | null;
}

export function TrendingProductsSection({ products, onAddToCart, addingProductId }: TrendingProductsSectionProps) {
  if (products.length === 0) return null;

  return (
    <Container size="lg" className="py-16 md:py-20">
      <SectionHeading
        eyebrow="Featured"
        title="Trending Products"
        description="Discover our most popular digital products loved by customers"
      />
      <ProductGrid products={products} onAddToCart={onAddToCart} addingProductId={addingProductId} />
    </Container>
  );
}
