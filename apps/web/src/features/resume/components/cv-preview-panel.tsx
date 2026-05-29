'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cvPreviewUrl } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 1.25;
const ZOOM_STEP = 0.1;
const WHEEL_PAGE_THRESHOLD = 48;
const WHEEL_COOLDOWN_MS = 280;

export function CvPreviewPanel({
  projectId,
  previewRevision,
  fetchDraftHtml,
  fallbackSnapshot,
  onRenderPageCount,
}: {
  projectId: string;
  previewRevision: number;
  fetchDraftHtml: (pageIndex: number) => Promise<string>;
  fallbackSnapshot?: string;
  onRenderPageCount?: (pageCount: number) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const wheelAccum = useRef(0);
  const lastWheelPageChange = useRef(0);
  const [zoom, setZoom] = useState(0.55);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const onRenderPageCountRef = useRef(onRenderPageCount);
  onRenderPageCountRef.current = onRenderPageCount;

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; pageCount?: number };
      if (data?.type !== 'stackfolio-cv-preview') return;
      if (typeof data.pageCount === 'number' && data.pageCount > 0) {
        setTotalPages(data.pageCount);
        onRenderPageCountRef.current?.(data.pageCount);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const pageIndex = currentPage - 1;

    const load = async () => {
      setLoadError(null);
      try {
        const html = await fetchDraftHtml(pageIndex);
        if (cancelled) return;
        revokeBlob();
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setIframeSrc(url);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Preview failed');
        if (fallbackSnapshot && projectId) {
          const hash =
            fallbackSnapshot.length > 48
              ? fallbackSnapshot.slice(0, 48)
              : fallbackSnapshot;
          const params = new URLSearchParams({ v: hash, page: String(pageIndex) });
          setIframeSrc(`${cvPreviewUrl(projectId)}?${params.toString()}`);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    previewRevision,
    currentPage,
    fetchDraftHtml,
    revokeBlob,
    fallbackSnapshot,
    projectId,
  ]);

  useEffect(() => () => revokeBlob(), [revokeBlob]);

  const fitToView = useCallback(() => {
    const width = scrollAreaRef.current?.clientWidth ?? A4_WIDTH_PX;
    const height = scrollAreaRef.current?.clientHeight ?? A4_HEIGHT_PX;
    const padding = 48;
    const scaleW = (width - padding) / A4_WIDTH_PX;
    const scaleH = (height - padding) / A4_HEIGHT_PX;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(scaleW, scaleH)));
    setZoom(Number(next.toFixed(2)));
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    fitToView();
  }, [fitToView]);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.min(totalPages, Math.max(1, page)));
      wheelAccum.current = 0;
    },
    [totalPages],
  );

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('[data-preview-controls]')) return;
      e.preventDefault();

      const now = Date.now();
      if (now - lastWheelPageChange.current < WHEEL_COOLDOWN_MS) return;

      wheelAccum.current += e.deltaY;
      if (Math.abs(wheelAccum.current) < WHEEL_PAGE_THRESHOLD) return;

      setCurrentPage((prev) => {
        if (wheelAccum.current > 0) return Math.min(totalPages, prev + 1);
        return Math.max(1, prev - 1);
      });
      wheelAccum.current = 0;
      lastWheelPageChange.current = now;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [totalPages]);

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-preview-controls]')) return;
    e.preventDefault();
    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  };

  const onCanvasPointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const externalUrl = cvPreviewUrl(projectId);
  const scaledW = A4_WIDTH_PX * zoom;
  const scaledH = A4_HEIGHT_PX * zoom;

  return (
    <div className="space-y-2">
      <div
        ref={viewportRef}
        className="relative overflow-hidden rounded border border-border bg-white"
        style={{ height: 'min(80vh, 900px)' }}
      >
        <div
          data-preview-controls
          className="pointer-events-auto absolute left-2 right-2 top-2 z-20 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-background/92 px-2 py-1.5 shadow-md backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
            >
              <ZoomOut size={15} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
            >
              <ZoomIn size={15} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Fit to view"
              onClick={fitToView}
            >
              <Maximize2 size={15} />
            </Button>
            <span className="px-1 text-xs text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft size={15} />
            </Button>
            <select
              id="cv-preview-page"
              name="cv-preview-page"
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              value={currentPage}
              onChange={(e) => goToPage(Number(e.target.value))}
              aria-label="Preview page"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Next page"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              <ChevronRight size={15} />
            </Button>
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              title="Open full resume (all pages, scroll like PDF)"
              aria-label="Open full resume in new tab"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-muted"
            >
              <ExternalLink size={15} />
            </a>
          </div>
        </div>

        <div
          ref={scrollAreaRef}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {loadError && (
            <p className="px-4 py-2 text-xs text-destructive">{loadError}</p>
          )}
          <div
            ref={canvasRef}
            className={`flex min-h-full w-full touch-none select-none items-start justify-center px-4 pb-6 pt-14 ${
              isPanning ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerCancel={onCanvasPointerUp}
          >
            <div
              className="shrink-0 shadow-lg"
              style={{
                width: scaledW,
                height: scaledH,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
              }}
            >
              {iframeSrc ? (
                <iframe
                  title="CV Preview"
                  src={iframeSrc}
                  scrolling="no"
                  className="pointer-events-none block border-0 bg-white"
                  style={{
                    width: A4_WIDTH_PX,
                    height: A4_HEIGHT_PX,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                  }}
                />
              ) : (
                <div
                  className="flex items-center justify-center bg-white text-sm text-muted-foreground"
                  style={{
                    width: A4_WIDTH_PX,
                    height: A4_HEIGHT_PX,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                  }}
                >
                  Loading preview…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages} · scroll to change page · drag to pan
      </p>
    </div>
  );
}
