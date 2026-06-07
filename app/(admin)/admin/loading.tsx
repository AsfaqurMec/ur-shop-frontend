import { Spinner } from '@/components/ui';

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>
  );
}
