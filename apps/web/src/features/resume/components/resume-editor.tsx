'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import type { JsonLayoutShape } from '@stackfolio/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, apiFetchText } from '@/lib/api-client';
import type { ResumeProject } from '../hooks/use-resume-project';
import { useDebouncedResumeSave } from '../hooks/use-debounced-resume-save';
import { usePreviewRefreshScheduler } from '../hooks/use-preview-refresh-scheduler';
import { buildPreviewSnapshot } from '../utils/preview-snapshot';
import { isDraftDirty } from '../utils/is-draft-dirty';
import { isPreviewStale } from '../utils/is-preview-stale';
import { pickResumePatch } from '../utils/resume-patch';
import {
  addPage,
  ensurePagesInitialized,
  getDetached,
  getLayout,
  getPages,
  patchDetachedAndPages,
  removePage,
  syncOverflowPagesFromPreview,
} from '../utils/layout-helpers';
import { toProfileResumeSource } from '../utils/profile-resume-source';
import { pagesFingerprint } from '../utils/pages-fingerprint';
import { CvPreviewPanel } from './cv-preview-panel';
import { normalizeResumeProject } from '../utils/normalize-resume-project';
import { TypographyControls } from './typography-controls';
import { HeaderSettings } from './header-settings';
import { MultiPageSectionList } from './multi-page-section-list';

const PREVIEW_IDLE_MS = 5_000;

export function ResumeEditor({
  projectId,
  token,
  initial,
}: {
  projectId: string;
  token: string;
  initial: ResumeProject;
}) {
  const [draft, setDraft] = useState<ResumeProject>(initial);
  const savedBaselineRef = useRef(buildPreviewSnapshot(initial));
  const previewRenderedBaselineRef = useRef(buildPreviewSnapshot(initial));
  const [previewRevision, setPreviewRevision] = useState(1);
  const { flush, isPending } = useDebouncedResumeSave(projectId, token);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const { data: linkedProfile } = useQuery({
    queryKey: ['profile', draft.profileId],
    queryFn: () =>
      apiFetch<{
        name: string;
        profileData: unknown;
        skills: Array<{
          level: string;
          years: number | null;
          highlight: boolean;
          displayCategory?: string | null;
          skill: {
            name: string;
            slug: string;
            category: string;
            categories?: string[];
          };
        }>;
      }>(`/profiles/${draft.profileId}`, { token }),
    enabled: Boolean(token && draft.profileId),
  });

  const profileSource = useMemo(
    () => (linkedProfile ? toProfileResumeSource(linkedProfile) : null),
    [linkedProfile],
  );

  useEffect(() => {
    const initPatch = ensurePagesInitialized(initial);
    if (initPatch) {
      setDraft((d) => ({ ...d, ...initPatch }));
    }
  }, [initial.id]);

  const dirty = useMemo(
    () => isDraftDirty(draft, savedBaselineRef.current),
    [draft],
  );

  const overflowPagesFingerprintRef = useRef<string | null>(null);

  const applyOverflowPageSync = useCallback(() => {
    if (!profileSource) return;
    const overflowPatch = syncOverflowPagesFromPreview(
      draftRef.current,
      profileSource,
    );
    if (!overflowPatch) return;
    const merged = { ...draftRef.current, ...overflowPatch };
    const fp = pagesFingerprint(getPages(merged));
    if (fp === overflowPagesFingerprintRef.current) return;
    overflowPagesFingerprintRef.current = fp;
    setDraft((prev) => {
      const next = { ...prev, ...overflowPatch };
      draftRef.current = next;
      return next;
    });
  }, [profileSource]);

  const overflowSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const scheduleOverflowPageSync = useCallback(() => {
    if (!profileSource) return;
    if (overflowSyncTimerRef.current) {
      clearTimeout(overflowSyncTimerRef.current);
    }
    overflowSyncTimerRef.current = setTimeout(() => {
      overflowSyncTimerRef.current = null;
      applyOverflowPageSync();
    }, 600);
  }, [profileSource, applyOverflowPageSync]);

  useEffect(
    () => () => {
      if (overflowSyncTimerRef.current) {
        clearTimeout(overflowSyncTimerRef.current);
      }
    },
    [],
  );

  const refreshPreviewFromDraft = useCallback((force = false) => {
    const snap = buildPreviewSnapshot(draftRef.current);
    if (!force && snap === previewRenderedBaselineRef.current) {
      return;
    }
    previewRenderedBaselineRef.current = snap;
    setPreviewRevision((r) => r + 1);
  }, []);

  const { schedule: schedulePreviewRefresh } = usePreviewRefreshScheduler(
    PREVIEW_IDLE_MS,
    () => refreshPreviewFromDraft(false),
  );

  const fetchDraftHtml = useCallback(
    (pageIndex: number) => {
      const qs = pageIndex > 0 ? `?page=${pageIndex}` : '';
      return apiFetchText(`/resume-projects/${projectId}/cv-preview${qs}`, {
        method: 'POST',
        token,
        body: JSON.stringify(pickResumePatch(draftRef.current)),
      });
    },
    [projectId, token],
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const layout = useMemo(() => getLayout(draft), [draft.jsonLayout]);
  const pages = useMemo(() => getPages(draft), [draft]);
  const detached = useMemo(() => getDetached(draft), [draft.jsonLayout]);

  const updateDraft = useCallback(
    (patch: Partial<ResumeProject>, options?: { skipPreviewSchedule?: boolean }) => {
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        draftRef.current = next;
        if (!options?.skipPreviewSchedule) {
          queueMicrotask(() => {
            if (isPreviewStale(next, previewRenderedBaselineRef.current)) {
              schedulePreviewRefresh();
            }
          });
        }
        return next;
      });
    },
    [schedulePreviewRefresh],
  );

  const saveNow = useCallback(() => {
    flush(draftRef.current, (saved) => {
      const snapshot = buildPreviewSnapshot(saved);
      savedBaselineRef.current = snapshot;
      previewRenderedBaselineRef.current = snapshot;
      setDraft(saved);
      setPreviewRevision((r) => r + 1);
    });
  }, [flush]);

  const persistLayout = (nextLayout: JsonLayoutShape) => {
    updateDraft({ jsonLayout: nextLayout });
  };

  const persistContinuationLayout = (nextLayout: JsonLayoutShape) => {
    updateDraft({ jsonLayout: nextLayout }, { skipPreviewSchedule: true });
    queueMicrotask(() => refreshPreviewFromDraft(true));
  };

  const exportPdf = async () => {
    flush(draftRef.current, async (saved) => {
      const snapshot = buildPreviewSnapshot(saved);
      savedBaselineRef.current = snapshot;
      previewRenderedBaselineRef.current = snapshot;
      setDraft(saved);
      setPreviewRevision((r) => r + 1);
      const blob = await apiFetch<Blob>(
        `/resume-projects/${projectId}/export-pdf`,
        {
          method: 'POST',
          token,
        },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${saved.name || 'resume'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const autofill = async () => {
    const updated = normalizeResumeProject(
      await apiFetch(`/resume-projects/${projectId}/autofill`, {
        method: 'POST',
        token,
      }),
    );
    const snapshot = buildPreviewSnapshot(updated);
    savedBaselineRef.current = snapshot;
    previewRenderedBaselineRef.current = snapshot;
    setDraft(updated);
    setPreviewRevision((r) => r + 1);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Resume editor</h1>
        {dirty && (
          <p
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100"
            role="status"
          >
            Unsaved changes. Leaving or reloading this page will discard edits
            unless you use Save now. Preview updates do not save to the
            database.
          </p>
        )}
        <label className="block text-sm font-medium" htmlFor="resume-name">
          Resume name
          <Input
            id="resume-name"
            name="resume-name"
            className="mt-1"
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm" htmlFor="resume-theme">
            Theme
            <select
              id="resume-theme"
              name="resume-theme"
              className="mt-1 w-full rounded border px-2 py-1"
              value={draft.theme}
              onChange={(e) => updateDraft({ theme: e.target.value })}
            >
              <option value="classic">Classic</option>
              <option value="modern">Modern</option>
            </select>
          </label>
          <label className="text-sm" htmlFor="resume-font">
            Font
            <select
              id="resume-font"
              name="resume-font"
              className="mt-1 w-full rounded border px-2 py-1"
              value={draft.font}
              onChange={(e) => updateDraft({ font: e.target.value })}
            >
              <option value="inter">Inter</option>
              <option value="serif">Serif</option>
              <option value="mono">Mono</option>
            </select>
          </label>
          <label className="text-sm" htmlFor="resume-dividers">
            Dividers
            <select
              id="resume-dividers"
              name="resume-dividers"
              className="mt-1 w-full rounded border px-2 py-1"
              value={draft.dividerStyle}
              onChange={(e) => updateDraft({ dividerStyle: e.target.value })}
            >
              <option value="line">Line</option>
              <option value="dotted">Dotted</option>
              <option value="none">None</option>
            </select>
          </label>
        </div>

        <TypographyControls
          layout={layout}
          onChange={(theme) =>
            persistLayout({ ...layout, theme: { ...layout.theme, ...theme } })
          }
        />

        <HeaderSettings
          layout={layout}
          profileSource={profileSource}
          visible={draft.visibility.header !== false}
          onVisibilityChange={(visible) =>
            updateDraft({
              visibility: { ...draft.visibility, header: visible },
            })
          }
          onLayoutChange={persistLayout}
        />

        <div>
          <h2 className="mb-2 font-semibold">Pages & sections</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Preview refreshes 5s after you stop editing (only when there are
            changes). It does not save your work.
          </p>
          <MultiPageSectionList
            pages={pages}
            detachedSectionIds={detached}
            layout={layout}
            profileSource={profileSource}
            visibility={draft.visibility}
            onLayoutPagesChange={(nextPages, nextDetached) => {
              updateDraft(patchDetachedAndPages(draft, nextPages, nextDetached));
            }}
            onLayoutChange={persistLayout}
            onContinuationLayoutChange={persistContinuationLayout}
            onVisibilityChange={(visibility) => updateDraft({ visibility })}
            onAddPage={() => updateDraft(addPage(draft))}
            onDeletePage={(pageIndex) => {
              const patch = removePage(draft, pageIndex);
              if (patch) updateDraft(patch);
            }}
          />
        </div>
      </div>
      <aside
        data-cv-preview-panel
        className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
      >
        <div className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div
            data-resume-editor-actions
            className="flex flex-wrap items-center gap-2"
          >
            <Button disabled={isPending || !dirty} onClick={saveNow}>
              Save now
            </Button>
            <Button variant="outline" onClick={autofill}>
              Sync from profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 shrink-0 p-0"
              aria-label="Update preview"
              title="Update preview (does not save)"
              onClick={() => refreshPreviewFromDraft(true)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={exportPdf}>
              Export PDF
            </Button>
          </div>
          <CvPreviewPanel
            projectId={projectId}
            previewRevision={previewRevision}
            fetchDraftHtml={fetchDraftHtml}
            fallbackSnapshot={savedBaselineRef.current}
            onRenderPageCount={scheduleOverflowPageSync}
          />
        </div>
      </aside>
    </div>
  );
}
