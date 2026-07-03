'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Container } from '@/components/ui';
import type { BannerItem } from '@/lib/api/banners';
import type { Product } from '@/types/product';
import { buildHeroSlides } from './utils';
import type { HeroSlide } from './types';

interface HeroSectionProps {
  banners: BannerItem[];
  featuredProducts: Product[];
}

const AUTOPLAY_MS = 5000;

export function HeroSection({ banners, featuredProducts }: HeroSectionProps) {
  const slides = useMemo(
    () => buildHeroSlides(banners, featuredProducts),
    [banners, featuredProducts]
  );
  const slideCount = slides.length;
  const [activeSlide, setActiveSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const safeActiveSlide = slideCount === 0 ? 0 : Math.min(activeSlide, slideCount - 1);
  const slide: HeroSlide | undefined = slides[safeActiveSlide];

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (slideCount <= 1) return;

    intervalRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev >= slideCount - 1 ? 0 : prev + 1));
    }, AUTOPLAY_MS);
  }, [slideCount, stopAutoplay]);

  const resetAutoplay = useCallback(() => {
    startAutoplay();
  }, [startAutoplay]);

  const goToPrevious = useCallback(() => {
    if (slideCount <= 1) return;
    setActiveSlide((prev) => (prev <= 0 ? slideCount - 1 : prev - 1));
    resetAutoplay();
  }, [resetAutoplay, slideCount]);

  const goToNext = useCallback(() => {
    if (slideCount <= 1) return;
    setActiveSlide((prev) => (prev >= slideCount - 1 ? 0 : prev + 1));
    resetAutoplay();
  }, [resetAutoplay, slideCount]);

  const goToSlide = useCallback(
    (index: number) => {
      if (slideCount <= 1) return;
      setActiveSlide(index);
      resetAutoplay();
    },
    [resetAutoplay, slideCount]
  );

  useEffect(() => {
    if (activeSlide >= slideCount && slideCount > 0) {
      setActiveSlide(slideCount - 1);
    }
  }, [activeSlide, slideCount]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  if (!slide) return null;

  return (
    <section className="relative isolate h-[85vh] overflow-hidden md:h-[80vh] lg:h-[95vh]">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden />
      <img
        key={safeActiveSlide}
        src={slide.imageUrl}
        alt=""
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-right-top md:object-center"
      />
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden />

      <Container
        size="lg"
        className="pointer-events-none relative z-10 flex h-full items-center"
      >
        <div className="pointer-events-auto max-w-3xl">
          <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:mt-8 sm:text-5xl md:text-6xl md:leading-[1.1] lg:text-7xl">
            {slide.title}
          </h1>

          {slide.subtitle ? (
            <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:mt-8 sm:text-lg md:text-xl">
              {slide.subtitle}
            </p>
          ) : null}

          {slide.buttons.length > 0 ? (
            <div className="mt-9 flex flex-col items-stretch gap-3 sm:mt-11 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              {slide.buttons.map((button, index) => (
                <Link key={`${button.title}-${index}`} href={button.route} className="w-full sm:w-auto">
                  <Button
                    variant={index === 0 ? 'primary' : 'outline'}
                    size="lg"
                    className="w-full min-w-0 shadow-lg shadow-primary/20 sm:min-w-[12rem]"
                  >
                    {button.title}
                    {index === 0 ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                  </Button>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </Container>

      {slideCount > 1 ? (
        <div className="pointer-events-none absolute inset-0 z-40">
          <div className="pointer-events-auto absolute bottom-12 md:bottom-24 left-2 md:left-6  flex items-center gap-2 rounded-full border border-white/25 bg-black/30 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-md ring-1 ring-black/10 sm:left-6">
            <button
              type="button"
              onClick={goToPrevious}
              className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/90 text-slate-950 shadow-lg shadow-black/15 transition duration-200 hover:-translate-x-0.5 hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 sm:h-14 sm:w-14"
              aria-label="Previous slide"
              data-testid="hero-previous-slide"
            >
              <ChevronLeft className="h-8 w-88 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={2.6} />
            </button>

            <span className="min-w-10 select-none text-center text-xs font-semibold tabular-nums text-white/90">
              {safeActiveSlide + 1}/{slideCount}
            </span>

            <button
              type="button"
              onClick={goToNext}
              className="group flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition duration-200 hover:translate-x-0.5 hover:scale-105 hover:bg-primary/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 sm:h-14 sm:w-14"
              aria-label="Next slide"
              data-testid="hero-next-slide"
            >
              <ChevronRight className="h-8 w-8 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.6} />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-2">
              {slides.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={`Show banner ${index + 1}`}
                  aria-current={index === safeActiveSlide ? 'true' : undefined}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === safeActiveSlide
                      ? 'w-8 bg-primary shadow-lg shadow-primary/30'
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
