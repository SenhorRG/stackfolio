'use client';

import {
  type HeaderAlign,
  type JsonLayoutShape,
  type ProfileResumeSource,
} from '@stackfolio/shared';
import { SectionOverridePanel } from './section-override-panel';
import { Eye, EyeOff } from 'lucide-react';

type Props = {
  layout: JsonLayoutShape;
  profileSource: ProfileResumeSource | null;
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  onLayoutChange: (layout: JsonLayoutShape) => void;
};

const aligns: HeaderAlign[] = ['left', 'center', 'right'];

export function HeaderSettings({
  layout,
  profileSource,
  visible,
  onVisibilityChange,
  onLayoutChange,
}: Props) {
  const header = layout.sections?.header ?? { align: 'left' as HeaderAlign };

  const setAlign = (align: HeaderAlign) => {
    onLayoutChange({
      ...layout,
      sections: {
        ...layout.sections,
        header: { ...header, align },
      },
    });
  };

  const setHeader = (config: typeof header) => {
    onLayoutChange({
      ...layout,
      sections: { ...layout.sections, header: config },
    });
  };

  return (
    <div className="rounded border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">Header (fixed at top)</span>
        <button
          type="button"
          className="rounded p-1 hover:bg-muted"
          title={visible ? 'Hide header' : 'Show header'}
          onClick={() => onVisibilityChange(!visible)}
        >
          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        {aligns.map((align) => (
          <button
            key={align}
            type="button"
            className={`rounded border px-2 py-1 text-xs capitalize ${
              (header.align ?? 'left') === align
                ? 'border-primary bg-primary/10'
                : 'border-border'
            }`}
            onClick={() => setAlign(align)}
          >
            {align}
          </button>
        ))}
      </div>
      
      <SectionOverridePanel
        sectionId="header"
        config={header}
        profileSource={profileSource}
        onChange={setHeader}
      />
    </div>
  );
}
