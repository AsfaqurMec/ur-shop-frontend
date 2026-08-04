export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Center Loading Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <div className="rounded-2xl  bg-background/10 px-8 py-8  backdrop-blur-md">
          <div className="flex flex-col items-center gap-5">
            {/* Spinner */}
            <div className="relative flex h-16 w-16 items-center justify-center">
  <span className="absolute h-full w-full animate-ping rounded-full bg-red-500/20" />
  <span className="absolute h-full w-full rounded-full border-4 border-red-500/20" />
  <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-red-600 border-t-transparent" />
</div>

            {/* Text */}
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome to <span className="text-red-600">UR Shop</span>
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Loading products, categories &amp; exclusive offers for you...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Skeleton */}
      <div className="mx-auto max-w-7xl animate-pulse space-y-10 px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="h-10 w-40 rounded-lg bg-muted" />

          <div className="hidden gap-4 md:flex">
            <div className="h-10 w-24 rounded-lg bg-muted" />
            <div className="h-10 w-24 rounded-lg bg-muted" />
            <div className="h-10 w-10 rounded-full bg-muted" />
          </div>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="h-5 w-32 rounded bg-muted" />

            <div className="space-y-3">
              <div className="h-12 w-full rounded bg-muted" />
              <div className="h-12 w-5/6 rounded bg-muted" />
            </div>

            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-4/5 rounded bg-muted" />
            </div>

            <div className="h-12 w-40 rounded-xl bg-muted" />
          </div>

          <div className="aspect-[4/3] rounded-3xl bg-muted" />
        </section>

        {/* Categories */}
        <section className="space-y-5">
          <div className="h-8 w-40 rounded bg-muted" />

          <div className="grid grid-cols-4 gap-5 sm:grid-cols-6 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="h-20 w-20 rounded-full bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section className="space-y-6">
          <div className="h-8 w-48 rounded bg-muted" />

          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="space-y-4 rounded-2xl border border-border p-3"
              >
                <div className="aspect-square rounded-xl bg-muted" />

                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>

                <div className="h-6 w-20 rounded bg-muted" />

                <div className="h-10 rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}