'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
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
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStartXRef = useRef(0);
  const dragCurrentXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

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

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

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
    stopAutoplay();
    if (!showNav || autoPlayMs <= 0) return;
    autoplayRef.current = setInterval(goNext, autoPlayMs);
    return stopAutoplay;
  }, [autoPlayMs, goNext, showNav, stopAutoplay]);

  const resetAutoplay = useCallback(() => {
    stopAutoplay();
    if (!showNav || autoPlayMs <= 0) return;
    autoplayRef.current = setInterval(goNext, autoPlayMs);
  }, [autoPlayMs, goNext, showNav, stopAutoplay]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!showNav || event.button !== 0) return;

      stopAutoplay();
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      dragStartXRef.current = event.clientX;
      dragCurrentXRef.current = event.clientX;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [showNav, stopAutoplay]
  );

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    dragCurrentXRef.current = event.clientX;
    const delta = event.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 8) hasDraggedRef.current = true;
    setDragOffset(Math.max(-140, Math.min(140, delta)));
  }, []);

  const finishDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;

      const delta = dragCurrentXRef.current - dragStartXRef.current;
      const viewportWidth = viewportRef.current?.clientWidth ?? 0;
      const threshold = Math.max(45, viewportWidth * 0.08);

      isDraggingRef.current = false;
      setDragOffset(0);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (Math.abs(delta) >= threshold) {
        if (delta < 0) goNext();
        else goPrev();
        resetAutoplay();
      } else {
        resetAutoplay();
      }
    },
    [goNext, goPrev, resetAutoplay]
  );

  const preventClickAfterDrag = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!hasDraggedRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    hasDraggedRef.current = false;
  }, []);

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
        <div
          ref={viewportRef}
          className="cursor-grab touch-pan-y overflow-hidden px-1 active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onClickCapture={preventClickAfterDrag}
        >
          <div
            className={`flex ease-out ${isDraggingRef.current ? '' : 'transition-transform duration-500'}`}
            style={{ transform: `translateX(calc(-${index * slideWidth}% + ${dragOffset}px))` }}
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
