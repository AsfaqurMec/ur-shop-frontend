
'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface HorizontalSliderProps {
  children: ReactNode[];
  visibleSm?: number;
  visibleLg?: number;
  autoPlayMs?: number;
  loop?: boolean;
  showDots?: boolean;
  className?: string;
}

export function HorizontalSlider({
  children,
  visibleSm = 1,
  visibleLg = 4,
  autoPlayMs = 4000,
  loop = true,
  showDots = true,
  className = '',
}: HorizontalSliderProps) {
  const [visible, setVisible] = useState(visibleSm);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Responsive slides
  useEffect(() => {
    const media = window.matchMedia('(min-width:1024px)');

    const update = () => {
      setVisible(media.matches ? visibleLg : visibleSm);
    };

    update();

    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, [visibleLg, visibleSm]);

  const plugins = useMemo(() => {
    if (autoPlayMs <= 0) return [];

    return [
      Autoplay({
        delay: autoPlayMs,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ];
  }, [autoPlayMs]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop,
      align: 'start',
      slidesToScroll: 1,
      containScroll: 'trimSnaps',
    },
    plugins
  );

  useEffect(() => {
    if (!emblaApi) return;

    const update = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      setScrollSnaps(emblaApi.scrollSnapList());
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };

    update();

    emblaApi.on('select', update);
    emblaApi.on('reInit', update);

    return () => {
      emblaApi.off('select', update);
      emblaApi.off('reInit', update);
    };
  }, [emblaApi]);

  if (!children.length) return null;

  const showNav = children.length > visible;

  return (
    <div className={className}>
      <div className="relative">
        {showNav && (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!loop && !canPrev}
              className="absolute -left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-background/95 p-2 shadow-md transition hover:bg-background disabled:pointer-events-none disabled:opacity-40 lg:-left-4"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!loop && !canNext}
              className="absolute -right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-background/95 p-2 shadow-md transition hover:bg-background disabled:pointer-events-none disabled:opacity-40 lg:-right-4"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div
          className="overflow-hidden px-1"
          ref={emblaRef}
        >
          <div className="flex">
            {children.map((child, index) => (
              <div
                key={index}
                className="min-w-0 shrink-0 px-2"
                style={{
                  flex: `0 0 ${100 / visible}%`,
                }}
              >
                {child}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDots && scrollSnaps.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                selectedIndex === index
                  ? 'w-6 bg-primary'
                  : 'w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}