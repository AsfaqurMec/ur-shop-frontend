'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Play, Sparkles } from 'lucide-react';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
import { VideoModal } from './VideoModal';

interface VideoBannerSectionProps {
  videoThumbnail: string;
}

const videoHighlights = [
  'HD product walkthroughs & tutorials',
  'Real customer use-case demos',
  'Tips to get the most from every purchase',
];

export function VideoBannerSection({ videoThumbnail }: VideoBannerSectionProps) {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden border-y border-border/50 py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 pattern-hero" aria-hidden />
        <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />

        <Container size="lg" className="relative">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 text-center lg:order-1 lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Watch &amp; Learn
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground md:text-4xl">
                See Our Products in Action
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base lg:mx-0 mx-auto">
                Watch how our digital products can transform your workflow and boost your productivity with real demos and walkthroughs.
              </p>
              <ul className="mt-8 space-y-3 text-left lg:mx-0 mx-auto max-w-md">
                {videoHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start justify-center">
                <Button
                  type="button"
                  size="lg"
                  className="shadow-lg shadow-primary/25"
                  onClick={() => setVideoModalOpen(true)}
                >
                  <Play className="mr-2 h-4 w-4 fill-current" />
                  Watch Full Video
                </Button>
                <Link href="/shop">
                  <Button type="button" variant="outline" size="lg">
                    Browse Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative mx-auto max-w-xl lg:max-w-none">
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-2xl" aria-hidden />
                <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl ring-1 ring-white/10">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-[1]" aria-hidden />
                  <img
                    src={videoThumbnail}
                    alt="Product showcase video thumbnail"
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setVideoModalOpen(true)}
                    className="group absolute inset-0 z-[2] flex items-center justify-center"
                    aria-label="Play product showcase video"
                  >
                    <span className="absolute h-24 w-24 rounded-full bg-primary/20 animate-ping" aria-hidden />
                    <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 transition-transform group-hover:scale-110">
                      <Play className="ml-1 h-9 w-9 fill-current" />
                    </span>
                  </button>
                  
                  
                </div>

                <div className="absolute z-[20] -bottom-10 -left-16 hidden rounded-xl border border-border bg-card px-4 py-3 shadow-lg sm:block">
                  <p className="text-xs text-muted-foreground">Trusted by</p>
                  <p className="text-lg font-bold text-foreground">10K+ Users</p>
                </div>
                <div className="absolute -top-8 -right-16 hidden rounded-xl border border-border bg-card px-4 py-3 shadow-lg sm:block">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Instant</p>
                      <p className="text-sm font-semibold text-foreground">Access</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <VideoModal open={videoModalOpen} onClose={() => setVideoModalOpen(false)} />
    </>
  );
}
