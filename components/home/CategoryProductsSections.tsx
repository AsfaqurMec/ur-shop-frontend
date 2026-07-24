import { CategoryProductSection } from '@/components/storefront';
import { Container } from '@/components/ui';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

interface CategoryProductsSectionsProps {
  categoryProducts: Array<{ category: Category; products: Product[] }>;
  onAddToCart: (product: Product) => void;
  addingProductId: number | null;
}

export function CategoryProductsSections({
  categoryProducts,
  onAddToCart,
  addingProductId,
}: CategoryProductsSectionsProps) {
  if (categoryProducts.length === 0) return null;

  return (
    <Container size="lg" className="py-16 md:py-5">
      {categoryProducts.map(({ category, products }) => (
        <CategoryProductSection
          key={category.id}
          category={category}
          products={products}
          onAddToCart={onAddToCart}
          addingProductId={addingProductId}
        />
      ))}
    </Container>
  );
}
