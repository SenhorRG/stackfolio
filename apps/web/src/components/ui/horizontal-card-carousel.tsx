'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

type HorizontalCardCarouselProps = {
  title?: string;
  emptyMessage: string;
  children: React.ReactNode;
  pageSize?: number;
};

export function HorizontalCardCarousel({
  title,
  emptyMessage,
  children,
  pageSize = 1,
}: HorizontalCardCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.firstElementChild?.clientWidth ?? 260;
    const gap = 16;
    const visible = Math.max(1, Math.floor((track.clientWidth + gap) / (cardWidth + gap)));
    const items = track.childElementCount;
    setPageCount(Math.max(1, Math.ceil(items / Math.max(visible, pageSize))));
  }, [pageSize]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, children]);

  const scrollToPage = (nextPage: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(nextPage, pageCount - 1));
    setPage(clamped);
    const cardWidth = track.firstElementChild?.clientWidth ?? 260;
    track.scrollTo({ left: clamped * (cardWidth + 16), behavior: 'smooth' });
  };

  const childArray = Array.isArray(children) ? children : [children];
  const hasItems = childArray.some((c) => c != null);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {title ? <h3 className="text-sm font-medium text-muted-foreground">{title}</h3> : <span />}
        {hasItems && pageCount > 1 && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 px-0"
              aria-label="Previous page"
              disabled={page === 0}
              onClick={() => scrollToPage(page - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
              {page + 1} / {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 px-0"
              aria-label="Next page"
              disabled={page >= pageCount - 1}
              onClick={() => scrollToPage(page + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
      {!hasItems ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-hidden scroll-smooth pb-2 snap-x snap-mandatory [scrollbar-width:thin]"
        >
          {children}
        </div>
      )}
    </section>
  );
}
