'use client';

import { getTheme, isTypographyUnit, spacingPresetToTypography } from '@stackfolio/shared';
import { Input } from '@/components/ui/input';
import type { JsonLayoutShape } from '@stackfolio/shared';
import { formFieldId } from '@/lib/form-field-id';

type Props = {
  layout: JsonLayoutShape;
  onChange: (theme: JsonLayoutShape['theme']) => void;
};

function TypographyField({
  fieldKey,
  label,
  value,
  onChange,
}: {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const valid = isTypographyUnit(value);
  const id = formFieldId('resume-typography', fieldKey);
  return (
    <label className="text-sm" htmlFor={id}>
      {label}
      <Input
        id={id}
        name={id}
        className="mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="11pt"
      />
      {!valid && value ? (
        <span className="mt-1 block text-xs text-destructive">
          Use pt units (e.g. 11pt, 14pt)
        </span>
      ) : null}
    </label>
  );
}

export function TypographyControls({ layout, onChange }: Props) {
  const theme = getTheme(layout);
  const applyPreset = (preset: string) => {
    onChange({ ...theme, ...spacingPresetToTypography(preset) });
  };

  return (
    <div className="space-y-3 rounded border border-border p-3">
      <h3 className="text-sm font-semibold">Typography (pt)</h3>
      <div className="grid grid-cols-3 gap-3">
        <TypographyField
          fieldKey="font-size"
          label="Font size"
          value={theme.fontSize}
          onChange={(fontSize) => onChange({ ...theme, fontSize })}
        />
        <TypographyField
          fieldKey="line-height"
          label="Line height"
          value={theme.lineHeight}
          onChange={(lineHeight) => onChange({ ...theme, lineHeight })}
        />
        <TypographyField
          fieldKey="section-gap"
          label="Section gap"
          value={theme.sectionGap}
          onChange={(sectionGap) => onChange({ ...theme, sectionGap })}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
          onClick={() => applyPreset('compact')}
        >
          Compact preset
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
          onClick={() => applyPreset('normal')}
        >
          Normal preset
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
          onClick={() => applyPreset('relaxed')}
        >
          Relaxed preset
        </button>
      </div>
    </div>
  );
}
