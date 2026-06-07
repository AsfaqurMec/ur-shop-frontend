import { Container } from '@/components/ui';
import { Spinner } from '@/components/ui';

export default function ProductLoading() {
  return (
    <Container size="lg" className="py-12">
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    </Container>
  );
}
