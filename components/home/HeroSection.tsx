// 'use client';

// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import Link from 'next/link';
// import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
// import { Container } from '@/components/ui';
// import { Button } from '@/components/ui';
// import type { BannerItem } from '@/lib/api/banners';
// import type { Product } from '@/types/product';
// import { buildHeroSlides } from './utils';
// import type { HeroSlide } from './types';

// interface HeroSectionProps {
//   banners: BannerItem[];
//   featuredProducts: Product[];
// }

// const AUTOPLAY_MS = 5000;

// export function HeroSection({ banners, featuredProducts }: HeroSectionProps) {
//   const slides = useMemo(
//     () => buildHeroSlides(banners, featuredProducts),
//     [banners, featuredProducts]
//   );
//   const [activeSlide, setActiveSlide] = useState(0);
//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const slideCount = slides.length;
//   const safeActiveSlide =
//     slideCount === 0 ? 0 : Math.min(activeSlide, slideCount - 1);
//   const slide: HeroSlide = slides[safeActiveSlide] ?? slides[0];

//   const goToPrevious = useCallback(() => {
//     if (slideCount <= 1) return;
//     setActiveSlide((prev) => (prev === 0 ? slideCount - 1 : prev - 1));
//   }, [slideCount]);

//   const goToNext = useCallback(() => {
//     if (slideCount <= 1) return;
//     setActiveSlide((prev) => (prev === slideCount - 1 ? 0 : prev + 1));
//   }, [slideCount]);

//   const goToSlide = useCallback(
//     (index: number) => {
//       if (slideCount <= 1) return;
//       setActiveSlide(index);
//     },
//     [slideCount]
//   );

//   const stopAutoplay = useCallback(() => {
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }
//   }, []);

//   const startAutoplay = useCallback(() => {
//     stopAutoplay();
//     if (slideCount <= 1) return;

//     intervalRef.current = setInterval(() => {
//       setActiveSlide((prev) => (prev === slideCount - 1 ? 0 : prev + 1));
//     }, AUTOPLAY_MS);
//   }, [slideCount, stopAutoplay]);

//   useEffect(() => {
//     startAutoplay();
//     return stopAutoplay;
//   }, [startAutoplay, stopAutoplay]);

//   const handlePrevious = () => {
//     goToPrevious();
//     startAutoplay();
//   };

//   const handleNext = () => {
//     goToNext();
//     startAutoplay();
//   };

//   const handleDotClick = (index: number) => {
//     goToSlide(index);
//     startAutoplay();
//   };

//   return (
//     <section className="relative overflow-hidden h-[85vh] md:h-[80vh] lg:h-[95vh]">
//       <div className="pointer-events-none absolute inset-0" aria-hidden />
//       <img
//         key={safeActiveSlide}
//         src={slide.imageUrl}
//         alt=""
//         className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right-top md:object-center"
//       />
//       <div className="pointer-events-none absolute inset-0" aria-hidden />

//       <Container size="lg" className="pointer-events-none relative z-0 flex h-full items-center">
//         <div className="pointer-events-auto relative z-0 max-w-3xl">
//           <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:mt-8 sm:text-5xl md:text-6xl lg:text-7xl md:leading-[1.1]">
//             {slide.title}
//           </h1>

//           {slide.subtitle && (
//             <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty sm:mt-8 sm:text-lg md:text-xl">
//               {slide.subtitle}
//             </p>
//           )}

//           {slide.buttons.length > 0 ? (
//             <div className="mt-9 flex flex-col items-stretch gap-3 sm:mt-11 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
//               {slide.buttons.map((button, index) => (
//                 <Link key={`${button.title}-${index}`} href={button.route} className="w-full sm:w-auto">
//                   <Button
//                     variant={index === 0 ? 'primary' : 'outline'}
//                     size="lg"
//                     className="w-full min-w-0 shadow-lg shadow-primary/20 sm:min-w-[12rem]"
//                   >
//                     {button.title}
//                     {index === 0 && <ArrowRight className="ml-2 h-4 w-4" />}
//                   </Button>
//                 </Link>
//               ))}
//             </div>
//           ) : null}
//         </div>
//       </Container>

//       {slideCount > 1 && (
//         <div className="pointer-events-none absolute inset-0 z-40">
//           <button
//             type="button"
//             onClick={handlePrevious}
//             className="pointer-events-auto absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 p-3 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-background sm:left-4 sm:h-12 sm:w-12"
//             aria-label="Previous slide"
//           >
//             <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
//           </button>
//           <button
//             type="button"
//             onClick={handleNext}
//             className="pointer-events-auto absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 p-3 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-background sm:right-4 sm:h-12 sm:w-12"
//             aria-label="Next slide"
//           >
//             <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
//           </button>

//           <div className="absolute inset-x-0 bottom-4 flex justify-center">
//             <div className="pointer-events-auto flex items-center gap-2">
//               {slides.map((item, index) => (
//                 <button
//                   key={`${item.title}-${index}`}
//                   type="button"
//                   onClick={() => handleDotClick(index)}
//                   aria-label={`Show banner ${index + 1}`}
//                   aria-current={index === safeActiveSlide ? 'true' : undefined}
//                   className={`h-2 rounded-full transition-all duration-300 ${
//                     index === safeActiveSlide
//                       ? 'w-8 bg-primary shadow-lg shadow-primary/30'
//                       : 'w-2 bg-white/30 hover:bg-white/50'
//                   }`}
//                 />
//               ))}
//             </div>
//           </div>
//         </div>
//       )}
//     </section>
//   );
// }

'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
  // Memoize slides to prevent recalculation on every render
  const slides = useMemo(() => buildHeroSlides(banners, featuredProducts), [banners, featuredProducts]);
  
  const [activeSlide, setActiveSlide] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeSlideRef = useRef(activeSlide);
  
  // Keep ref in sync with state
  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

  const slide: HeroSlide = slides[activeSlide] ?? slides[0];

  const goToPrevious = useCallback(() => {
    setActiveSlide((prev) => {
      const newIndex = prev === 0 ? slides.length - 1 : prev - 1;
      return newIndex;
    });
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setActiveSlide((prev) => {
      const newIndex = prev === slides.length - 1 ? 0 : prev + 1;
      return newIndex;
    });
  }, [slides.length]);

  // Setup autoplay
  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, AUTOPLAY_MS);

    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [slides.length]); // Only depends on slides.length, not goToNext

  // Manual navigation with interval reset
  const handlePrevious = () => {
    goToPrevious();
    // Reset the interval timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (slides.length > 1) {
      intervalRef.current = setInterval(() => {
        setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, AUTOPLAY_MS);
    }
  };

  const handleNext = () => {
    goToNext();
    // Reset the interval timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (slides.length > 1) {
      intervalRef.current = setInterval(() => {
        setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, AUTOPLAY_MS);
    }
  };

  const handleDotClick = (index: number) => {
    setActiveSlide(index);
    // Reset the interval timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (slides.length > 1) {
      intervalRef.current = setInterval(() => {
        setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, AUTOPLAY_MS);
    }
  };

  return (
    <section className="relative overflow-hidden h-[85vh] md:h-[80vh] lg:h-[95vh]">
      <div className="pointer-events-none absolute inset-0" aria-hidden />
      <img
        key={activeSlide}
        src={slide.imageUrl}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right-top md:object-center"
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
            onClick={handlePrevious}
            className="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-background/90 p-3 shadow-lg backdrop-blur transition hover:bg-background hover:scale-105 sm:left-4"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
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
                  onClick={() => handleDotClick(index)}
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