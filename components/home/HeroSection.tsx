'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';
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
  const slides = buildHeroSlides(banners, featuredProducts);
  const [activeSlide, setActiveSlide] = useState(0);
  const slide: HeroSlide = slides[activeSlide] ?? slides[0];

  const goToPrevious = useCallback(() => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(goToNext, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [goToNext, slides.length]);

  return (
    <section className="relative overflow-hidden h-[85vh] md:h-[80vh] lg:h-[95vh]">
      <div className="pointer-events-none absolute inset-0" aria-hidden />
      <img
        key={activeSlide}
        src={slide.imageUrl}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden />

      <Container size="lg" className="pointer-events-none relative flex h-full items-center">
        <div className="pointer-events-auto max-w-3xl">
          <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:mt-8 sm:text-5xl md:text-6xl lg:text-7xl md:leading-[1.1]">
            {slide.title}
          </h1>

          {slide.subtitle && (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty sm:mt-8 sm:text-lg md:text-xl">
              {slide.subtitle}
            </p>
          )}

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
                    {index === 0 && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </Container>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-background/90 p-3 shadow-lg backdrop-blur transition hover:bg-background hover:scale-105 sm:left-4"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-background/90 p-3 shadow-lg backdrop-blur transition hover:bg-background hover:scale-105 sm:right-4"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-2">
              {slides.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show banner ${index + 1}`}
                  aria-current={index === activeSlide ? 'true' : undefined}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeSlide
                      ? 'w-8 bg-primary shadow-lg shadow-primary/30'
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
