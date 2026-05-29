'use client';

import {
  continuationOverrideKey,
  getContinuationMode,
  ResumeSectionLabel,
  type ContinuationMode,
  type JsonLayoutShape,
  type ResumeSectionIdValue,
} from '@stackfolio/shared';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ModalOverlay } from '@/components/ui/modal-overlay';

type Props = {
  open: boolean;
  pageId: string;
  sectionId: ResumeSectionIdValue;
  fromPageIndex: number;
  pageIndex: number;
  layout: JsonLayoutShape;
  onClose: () => void;
  onApply: (layout: JsonLayoutShape) => void;
};

const MODES: Array<{
  value: ContinuationMode;
  title: string;
  description: string;
}> = [
  {
    value: 'overflow-only',
    title: 'Bring only overflow',
    description:
      'Only content that did not fit on the previous page continues here.',
  },
  {
    value: 'entire-subsection',
    title: 'Bring entire sub-section',
    description:
      'Move the whole logical unit (e.g. full job with header and all bullets) to this page, even if part appeared earlier.',
  },
];

function buildLayoutWithMode(
  layout: JsonLayoutShape,
  pageId: string,
  sectionId: ResumeSectionIdValue,
  mode: ContinuationMode,
): JsonLayoutShape {
  const key = continuationOverrideKey(pageId, sectionId);
  const overrides = { ...(layout.continuationOverrides ?? {}) };
  if (mode === 'overflow-only') {
    delete overrides[key];
  } else {
    overrides[key] = mode;
  }
  return {
    ...layout,
    continuationOverrides: Object.keys(overrides).length ? overrides : undefined,
  };
}

export function ContinuationConfigPanel({
  open,
  pageId,
  sectionId,
  fromPageIndex,
  pageIndex,
  layout,
  onClose,
  onApply,
}: Props) {
  const canConfigureContinuation = pageIndex > fromPageIndex;
  const savedMode = getContinuationMode(
    layout.continuationOverrides,
    pageId,
    sectionId,
  );
  const [pendingMode, setPendingMode] = useState<ContinuationMode>(savedMode);

  useEffect(() => {
    if (open) {
      setPendingMode(savedMode);
    }
  }, [open, savedMode]);

  if (!open) return null;

  const sectionTitle = ResumeSectionLabel[sectionId];

  const handleApply = () => {
    if (!canConfigureContinuation) {
      onClose();
      return;
    }
    onApply(buildLayoutWithMode(layout, pageId, sectionId, pendingMode));
    onClose();
  };

  return (
    <ModalOverlay open={open} onBackdropClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="continuation-config-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="continuation-config-title" className="text-lg font-semibold">
          Continuation — {sectionTitle}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {canConfigureContinuation
            ? `Page overflow from page ${fromPageIndex + 1}. Choose what appears on this page in the preview.`
            : `Continuations only appear on pages after page ${fromPageIndex + 1} (the section primary page).`}
        </p>
        <fieldset className="mt-4 space-y-2" disabled={!canConfigureContinuation}>
          {MODES.map((mode) => (
            <label
              key={mode.value}
              className={`flex cursor-pointer gap-3 rounded-md border p-3 transition-colors ${
                pendingMode === mode.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name="continuation-mode"
                className="mt-1"
                checked={pendingMode === mode.value}
                onChange={() => setPendingMode(mode.value)}
              />
              <span>
                <span className="block text-sm font-medium">{mode.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {mode.description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply} disabled={!canConfigureContinuation}>
            Apply
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}
