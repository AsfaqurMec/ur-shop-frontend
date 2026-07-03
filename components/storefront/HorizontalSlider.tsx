'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface HorizontalSliderProps {
  children: ReactNode[];
  visibleSm?: number;
  visibleLg?: number;
  autoPlayMs?: number;
  loop?: boolean;
  className?: string;
}

export function HorizontalSlider({
  children,
  visibleSm = 1,
  visibleLg = 4,
  autoPlayMs = 4000,
  loop = true,
  className = '',
}: HorizontalSliderProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(visibleSm);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => {
      setVisible(mq.matches ? visibleLg : visibleSm);
      setIndex(0);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [visibleSm, visibleLg]);

  const count = children.length;
  const maxIndex = Math.max(0, count - visible);
  const slideWidth = 100 / visible;
  const showNav = count > visible;

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setIndex((i) => {
      if (i <= 0) return loop ? maxIndex : 0;
      return i - 1;
    });
  }, [loop, maxIndex]);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= maxIndex) return loop ? 0 : maxIndex;
      return i + 1;
    });
  }, [loop, maxIndex]);

  useEffect(() => {
    if (!showNav || autoPlayMs <= 0) return;
    const interval = setInterval(goNext, autoPlayMs);
    return () => clearInterval(interval);
  }, [autoPlayMs, goNext, showNav]);

  if (count === 0) return null;

  return (
    <div className={className}>
      <div className="relative">
        {showNav && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={!loop && index === 0}
              className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/95 p-2 shadow-md transition hover:bg-background disabled:pointer-events-none disabled:opacity-40 lg:-left-4"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!loop && index >= maxIndex}
              className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/95 p-2 shadow-md transition hover:bg-background disabled:pointer-events-none disabled:opacity-40 lg:-right-4"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        <div className="overflow-hidden px-1">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * slideWidth}%)` }}
          >
            {children.map((child, i) => (
              <div key={i} className="flex-shrink-0 px-2" style={{ width: `${slideWidth}%` }}>
                {child}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
