'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  buildPrimarySectionPageIndex,
  ensureUniquePageIds,
  getContinuationMode,
  ResumeSectionLabel,
  sanitizeResumePageContinuations,
  sanitizeSectionIds,
  type ContinuationMode,
  type JsonLayoutShape,
  type ProfileResumeSource,
  type ResumePageLayout,
  type ResumeSectionIdValue,
} from '@stackfolio/shared';
import { GripVertical, Eye, EyeOff, Settings2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ContinuationConfigPanel } from './continuation-config-panel';
import { SectionOverridePanel } from './section-override-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function isOverflowSectionPlacement(
  sectionId: ResumeSectionIdValue,
  pageIndex: number,
  primaryBySection: Map<ResumeSectionIdValue, number>,
  continuationSectionIds: ResumeSectionIdValue[],
): boolean {
  if (continuationSectionIds.includes(sectionId)) return true;
  const primaryPageIndex = primaryBySection.get(sectionId);
  return primaryPageIndex !== undefined && primaryPageIndex < pageIndex;
}

function sanitizePages(pages: ResumePageLayout[]): ResumePageLayout[] {
  const normalized = pages.map((page) => ({
    ...page,
    sectionIds: sanitizeSectionIds(page.sectionIds),
    continuationSectionIds: page.continuationSectionIds
      ? sanitizeSectionIds(page.continuationSectionIds)
      : undefined,
  }));
  return ensureUniquePageIds(sanitizeResumePageContinuations(normalized));
}

function PageDropZone({
  pageIndex,
  children,
}: {
  pageIndex: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `page-drop-${pageIndex}` });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border border-dashed p-3 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      {children}
    </div>
  );
}

function DetachedDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'detached-drop' });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border border-dashed p-3 transition-colors ${
        isOver
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-muted-foreground/40 bg-muted/30'
      }`}
    >
      {children}
    </div>
  );
}

const CONTINUATION_MODE_LABEL: Record<ContinuationMode, string> = {
  'overflow-only': 'Overflow only',
  'entire-subsection': 'Entire sub-section',
};

function ContinuationSectionRow({
  id,
  fromPageIndex,
  continuationMode,
  onConfigure,
}: {
  id: ResumeSectionIdValue;
  fromPageIndex: number;
  continuationMode: ContinuationMode;
  onConfigure: () => void;
}) {
  const sectionTitle = ResumeSectionLabel[id];
  return (
    <div
      className="rounded border border-dashed border-muted-foreground/30 bg-muted/40 p-3 opacity-70"
      aria-label={`${sectionTitle} overflow from page ${fromPageIndex + 1}`}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="flex-1 font-medium text-muted-foreground">
          {sectionTitle}
        </span>
        <span className="hidden rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">
          {CONTINUATION_MODE_LABEL[continuationMode]}
        </span>
        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Continued from page {fromPageIndex + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          aria-label={`Configure continuation for ${sectionTitle}`}
          onClick={onConfigure}
        >
          <Settings2 size={15} />
        </Button>
      </div>
    </div>
  );
}

type PageSectionRow =
  | {
      kind: 'continuation';
      sectionId: ResumeSectionIdValue;
      fromPageIndex: number;
    }
  | { kind: 'editable'; sectionId: ResumeSectionIdValue };

function buildDocumentSectionOrder(
  pages: ResumePageLayout[],
): ResumeSectionIdValue[] {
  const seen = new Set<ResumeSectionIdValue>();
  const ordered: ResumeSectionIdValue[] = [];
  for (const page of pages) {
    for (const sectionId of page.sectionIds) {
      if (sectionId === 'header' || seen.has(sectionId)) continue;
      seen.add(sectionId);
      ordered.push(sectionId);
    }
  }
  return ordered;
}

function sortByDocumentOrder(
  sectionIds: ResumeSectionIdValue[],
  documentSectionOrder: ResumeSectionIdValue[],
): ResumeSectionIdValue[] {
  return [...sectionIds].sort(
    (a, b) =>
      documentSectionOrder.indexOf(a) - documentSectionOrder.indexOf(b),
  );
}

function buildPageSectionRows(
  page: ResumePageLayout,
  pageIndex: number,
  primaryBySection: Map<ResumeSectionIdValue, number>,
  documentSectionOrder: ResumeSectionIdValue[],
): PageSectionRow[] {
  const sectionIds = page.sectionIds;
  const continuationIds = sortByDocumentOrder(
    page.continuationSectionIds ?? [],
    documentSectionOrder,
  );
  const rows: PageSectionRow[] = [];
  const continuationSeen = new Set<ResumeSectionIdValue>();

  const addContinuationRow = (sectionId: ResumeSectionIdValue) => {
    if (continuationSeen.has(sectionId)) return;
    continuationSeen.add(sectionId);
    rows.push({
      kind: 'continuation',
      sectionId,
      fromPageIndex: primaryBySection.get(sectionId) ?? pageIndex - 1,
    });
  };

  for (const sectionId of documentSectionOrder) {
    if (sectionIds.includes(sectionId)) continue;
    if (!continuationIds.includes(sectionId)) continue;
    const primaryPageIndex = primaryBySection.get(sectionId);
    if (primaryPageIndex !== undefined && pageIndex <= primaryPageIndex) {
      continue;
    }
    addContinuationRow(sectionId);
  }

  for (const sectionId of documentSectionOrder) {
    if (!sectionIds.includes(sectionId)) continue;
    if (
      isOverflowSectionPlacement(
        sectionId,
        pageIndex,
        primaryBySection,
        continuationIds,
      )
    ) {
      addContinuationRow(sectionId);
    }
  }

  for (const sectionId of sectionIds) {
    if (
      !isOverflowSectionPlacement(
        sectionId,
        pageIndex,
        primaryBySection,
        continuationIds,
      )
    ) {
      rows.push({ kind: 'editable', sectionId });
    }
  }

  return rows;
}

function isClickOutsideSectionEditor(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return !target.closest(
    [
      '[data-section-row]',
      '[data-resume-editor-actions]',
      '[data-cv-preview-panel]',
      '[data-preview-controls]',
      '[role="dialog"]',
    ].join(','),
  );
}

function SortableSectionRow({
  id,
  visible,
  expanded,
  layout,
  onToggleVisible,
  onToggleExpanded,
  onSectionChange,
  onTitleChange,
  profileSource,
}: {
  id: ResumeSectionIdValue;
  visible: boolean;
  expanded: boolean;
  layout: JsonLayoutShape;
  profileSource: ProfileResumeSource | null;
  onToggleVisible: () => void;
  onToggleExpanded: () => void;
  onSectionChange: (
    config: NonNullable<JsonLayoutShape['sections']>[ResumeSectionIdValue],
  ) => void;
  onTitleChange: (title: string) => void;
}) {
  const sectionCfg = layout.sections?.[id];
  const customTitle = sectionCfg?.sectionTitle ?? sectionCfg?.title;
  const sectionTitle =
    typeof customTitle === 'string' && customTitle.trim()
      ? customTitle.trim()
      : ResumeSectionLabel[id];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-section-row
      className="rounded border border-border bg-card p-3"
    >
      <div className="flex items-center gap-2">
        <button type="button" {...attributes} {...listeners} className="cursor-grab">
          <GripVertical size={16} />
        </button>
        <button
          type="button"
          className="flex-1 text-left font-medium"
          onClick={onToggleExpanded}
        >
          {sectionTitle}
        </button>
        <button
          type="button"
          className="rounded p-1 hover:bg-muted"
          onClick={onToggleVisible}
        >
          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
      {expanded ? (
        <div className="mt-2 space-y-2">
          <label className="block text-xs text-muted-foreground">
            Section title
            <Input
              id={`section-title-${id}`}
              name={`section-title-${id}`}
              className="mt-1 h-8 text-sm"
              value={
                typeof layout.sections?.[id]?.sectionTitle === 'string'
                  ? layout.sections[id]!.sectionTitle!
                  : typeof layout.sections?.[id]?.title === 'string'
                    ? layout.sections[id]!.title!
                    : ''
              }
              placeholder={ResumeSectionLabel[id]}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </label>
          <SectionOverridePanel
            sectionId={id}
            config={layout.sections?.[id]}
            profileSource={profileSource}
            onChange={onSectionChange}
          />
        </div>
      ) : null}
    </div>
  );
}

export function MultiPageSectionList({
  pages,
  detachedSectionIds,
  layout,
  visibility,
  onLayoutPagesChange,
  onLayoutChange,
  onContinuationLayoutChange,
  onVisibilityChange,
  onAddPage,
  onDeletePage,
  profileSource,
}: {
  pages: ResumePageLayout[];
  detachedSectionIds: ResumeSectionIdValue[];
  layout: JsonLayoutShape;
  profileSource: ProfileResumeSource | null;
  visibility: Record<string, boolean>;
  onLayoutPagesChange: (
    pages: ResumePageLayout[],
    detached: ResumeSectionIdValue[],
  ) => void;
  onLayoutChange: (layout: JsonLayoutShape) => void;
  onContinuationLayoutChange: (layout: JsonLayoutShape) => void;
  onVisibilityChange: (visibility: Record<string, boolean>) => void;
  onAddPage: () => void;
  onDeletePage: (pageIndex: number) => void;
}) {
  const [activeId, setActiveId] = useState<ResumeSectionIdValue | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [continuationConfig, setContinuationConfig] = useState<{
    pageId: string;
    sectionId: ResumeSectionIdValue;
    fromPageIndex: number;
  } | null>(null);

  const safePages = useMemo(() => sanitizePages(pages), [pages]);
  const safeDetached = useMemo(
    () => sanitizeSectionIds(detachedSectionIds),
    [detachedSectionIds],
  );
  const primaryBySection = useMemo(
    () => buildPrimarySectionPageIndex(safePages),
    [safePages],
  );
  const documentSectionOrder = useMemo(
    () => buildDocumentSectionOrder(safePages),
    [safePages],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const hasExpandedSection = useMemo(
    () => Object.values(expanded).some(Boolean),
    [expanded],
  );

  useEffect(() => {
    if (!hasExpandedSection) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!isClickOutsideSectionEditor(event.target)) return;
      setExpanded({});
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [hasExpandedSection]);

  const findPrimaryPageIndex = (sectionId: ResumeSectionIdValue) =>
    safePages.findIndex((p) => p.sectionIds.includes(sectionId));

  const isDetached = (sectionId: ResumeSectionIdValue) =>
    safeDetached.includes(sectionId);

  const isOverflowPlacement = (
    sectionId: ResumeSectionIdValue,
    pageIndex: number,
    continuationSectionIds: ResumeSectionIdValue[] = [],
  ) =>
    isOverflowSectionPlacement(
      sectionId,
      pageIndex,
      primaryBySection,
      continuationSectionIds,
    );

  const commitPagesAndDetached = (
    nextPages: ResumePageLayout[],
    nextDetached: ResumeSectionIdValue[],
  ) => {
    const strippedPages = nextPages.map((page) => ({
      id: page.id,
      sectionIds: page.sectionIds,
      ...(page.continuationSectionIds?.length
        ? { continuationSectionIds: page.continuationSectionIds }
        : {}),
    }));
    onLayoutPagesChange(sanitizePages(strippedPages), sanitizeSectionIds(nextDetached));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeSection = active.id as ResumeSectionIdValue;
    const overId = String(over.id);
    const fromDetached = isDetached(activeSection);

    if (overId === 'detached-drop') {
      if (fromDetached) return;
      const sourcePageIndex = findPrimaryPageIndex(activeSection);
      if (sourcePageIndex < 0) return;
      const nextPages = safePages.map((p) => ({
        ...p,
        sectionIds: p.sectionIds.filter((id) => id !== activeSection),
      }));
      const nextDetached = sanitizeSectionIds([...safeDetached, activeSection]);
      commitPagesAndDetached(nextPages, nextDetached);
      onVisibilityChange({ ...visibility, [activeSection]: false });
      return;
    }

    let targetPageIndex = -1;
    let targetIndex = 0;

    if (overId.startsWith('page-drop-')) {
      targetPageIndex = Number(overId.replace('page-drop-', ''));
      targetIndex = safePages[targetPageIndex]?.sectionIds.length ?? 0;
    } else {
      const overSection = overId as ResumeSectionIdValue;
      if (isDetached(overSection)) return;
      targetPageIndex = findPrimaryPageIndex(overSection);
      if (targetPageIndex < 0) return;
      if (
        isOverflowPlacement(
          overSection,
          targetPageIndex,
          safePages[targetPageIndex]?.continuationSectionIds,
        )
      ) {
        return;
      }
      targetIndex = safePages[targetPageIndex]?.sectionIds.indexOf(overSection) ?? 0;
    }

    if (targetPageIndex < 0 || targetPageIndex >= safePages.length) return;

    const nextPages = safePages.map((p) => ({
      ...p,
      sectionIds: [...p.sectionIds],
    }));
    let nextDetached = [...safeDetached];

    if (fromDetached) {
      nextDetached = nextDetached.filter((id) => id !== activeSection);
      for (const page of nextPages) {
        page.sectionIds = page.sectionIds.filter((id) => id !== activeSection);
      }
      const targetIds = nextPages[targetPageIndex].sectionIds;
      const insertAt = Math.min(Math.max(targetIndex, 0), targetIds.length);
      targetIds.splice(insertAt, 0, activeSection);
      commitPagesAndDetached(nextPages, nextDetached);
      return;
    }

    const sourcePageIndex = findPrimaryPageIndex(activeSection);
    if (sourcePageIndex < 0) return;

    const primaryPageIndex = primaryBySection.get(activeSection);
    if (
      primaryPageIndex !== undefined &&
      targetPageIndex < primaryPageIndex &&
      sourcePageIndex > primaryPageIndex
    ) {
      return;
    }

    if (sourcePageIndex === targetPageIndex) {
      const ids = [...nextPages[sourcePageIndex].sectionIds];
      const fromIndex = ids.indexOf(activeSection);
      if (fromIndex < 0) return;
      nextPages[sourcePageIndex].sectionIds = arrayMove(
        ids,
        fromIndex,
        targetIndex,
      );
    } else {
      const sourceIds = nextPages[sourcePageIndex].sectionIds;
      const fromIndex = sourceIds.indexOf(activeSection);
      if (fromIndex < 0) return;
      sourceIds.splice(fromIndex, 1);
      const targetIds = nextPages[targetPageIndex].sectionIds;
      const insertAt = Math.min(Math.max(targetIndex, 0), targetIds.length);
      targetIds.splice(insertAt, 0, activeSection);
    }

    commitPagesAndDetached(nextPages, nextDetached);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e: DragStartEvent) =>
        setActiveId(e.active.id as ResumeSectionIdValue)
      }
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {safeDetached.length > 0 && (
          <DetachedDropZone>
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>Hidden sections (not on any page)</span>
              <span>{safeDetached.length}</span>
            </div>
            <SortableContext
              items={safeDetached}
              strategy={verticalListSortingStrategy}
            >
              <div className="min-h-[2rem] space-y-2">
                {safeDetached.map((sectionId) => (
                  <SortableSectionRow
                    key={`detached:${sectionId}`}
                    id={sectionId}
                    visible={false}
                    expanded={Boolean(expanded[sectionId])}
                    layout={layout}
                    onToggleVisible={() =>
                      onVisibilityChange({
                        ...visibility,
                        [sectionId]: visibility[sectionId] === false,
                      })
                    }
                    onToggleExpanded={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [sectionId]: !prev[sectionId],
                      }))
                    }
                    onSectionChange={(config) =>
                      onLayoutChange({
                        ...layout,
                        sections: { ...layout.sections, [sectionId]: config },
                      })
                    }
                    onTitleChange={(title) =>
                      onLayoutChange({
                        ...layout,
                        sections: {
                          ...layout.sections,
                          [sectionId]: {
                            ...layout.sections?.[sectionId],
                            sectionTitle: title.trim() || undefined,
                            title: undefined,
                          },
                        },
                      })
                    }
                    profileSource={profileSource}
                  />
                ))}
              </div>
            </SortableContext>
          </DetachedDropZone>
        )}

        {safePages.map((page, pageIndex) => {
          const pageRows = buildPageSectionRows(
            page,
            pageIndex,
            primaryBySection,
            documentSectionOrder,
          );
          const editableSectionIds = pageRows
            .filter((row) => row.kind === 'editable')
            .map((row) => row.sectionId);
          const totalSections = pageRows.length;
          return (
            <PageDropZone key={page.id} pageIndex={pageIndex}>
              <div className="mb-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  Page {pageIndex + 1}
                  {pageIndex > 0 ? ' (overflow continues here)' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <span>{totalSections} sections</span>
                  {pageIndex > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-destructive hover:text-destructive"
                      aria-label={`Delete page ${pageIndex + 1}`}
                      onClick={() => onDeletePage(pageIndex)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  )}
                </div>
              </div>
              <SortableContext
                items={editableSectionIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="min-h-[2rem] space-y-2">
                  {pageRows.map((row) => {
                    const sectionId = row.sectionId;
                    if (row.kind === 'continuation') {
                      return (
                        <ContinuationSectionRow
                          key={`${page.id}:continuation:${sectionId}`}
                          id={sectionId}
                          fromPageIndex={row.fromPageIndex}
                          continuationMode={getContinuationMode(
                            layout.continuationOverrides,
                            page.id,
                            sectionId,
                          )}
                          onConfigure={() =>
                            setContinuationConfig({
                              pageId: page.id,
                              sectionId,
                              fromPageIndex: row.fromPageIndex,
                            })
                          }
                        />
                      );
                    }
                    return (
                      <SortableSectionRow
                        key={`${page.id}:${sectionId}`}
                        id={sectionId}
                        visible={visibility[sectionId] !== false}
                        expanded={Boolean(expanded[sectionId])}
                        layout={layout}
                        onToggleVisible={() =>
                          onVisibilityChange({
                            ...visibility,
                            [sectionId]: visibility[sectionId] === false,
                          })
                        }
                        onToggleExpanded={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [sectionId]: !prev[sectionId],
                          }))
                        }
                        onSectionChange={(config) =>
                          onLayoutChange({
                            ...layout,
                            sections: { ...layout.sections, [sectionId]: config },
                          })
                        }
                        onTitleChange={(title) =>
                          onLayoutChange({
                            ...layout,
                            sections: {
                              ...layout.sections,
                              [sectionId]: {
                                ...layout.sections?.[sectionId],
                                sectionTitle: title.trim() || undefined,
                                title: undefined,
                              },
                            },
                          })
                        }
                        profileSource={profileSource}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </PageDropZone>
          );
        })}
        <Button type="button" variant="outline" size="sm" onClick={onAddPage}>
          Add page
        </Button>
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="rounded border bg-card p-3 shadow-md">
            {ResumeSectionLabel[activeId]}
          </div>
        ) : null}
      </DragOverlay>
      {continuationConfig ? (
        <ContinuationConfigPanel
          open
          pageId={continuationConfig.pageId}
          sectionId={continuationConfig.sectionId}
          fromPageIndex={continuationConfig.fromPageIndex}
          pageIndex={safePages.findIndex(
            (page) => page.id === continuationConfig.pageId,
          )}
          layout={layout}
          onClose={() => setContinuationConfig(null)}
          onApply={onContinuationLayoutChange}
        />
      ) : null}
    </DndContext>
  );
}
