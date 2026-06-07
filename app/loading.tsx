import { Spinner } from '@/components/ui';

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-primary" />
    </div>
  );
}
