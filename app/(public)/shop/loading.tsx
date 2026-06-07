import { Container } from '@/components/ui';
import { Spinner } from '@/components/ui';

export default function ShopLoading() {
  return (
    <Container size="lg" className="py-8">
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    </Container>
  );
}
