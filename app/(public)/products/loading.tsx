import { Spinner } from '@/components/ui';

export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <Spinner size="lg" />
    </div>
  );
}
