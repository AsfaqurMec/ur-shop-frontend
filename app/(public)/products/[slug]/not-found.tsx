import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-semibold mb-2">Product not found</h1>
      <p className="text-muted-foreground mb-6 text-center">
        The product you're looking for doesn't exist or has been removed.
      </p>
      <Link
        href="/shop"
        className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
      >
        Back to shop
      </Link>
    </div>
  );
}
