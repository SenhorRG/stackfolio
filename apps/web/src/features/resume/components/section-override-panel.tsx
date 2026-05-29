'use client';

import type {
  ProfileResumeSource,
  ResumeSectionLayoutConfig,
  ResumeSectionIdValue,
} from '@stackfolio/shared';
import { seedSectionAsCustom } from '@stackfolio/shared';
import { Input } from '@/components/ui/input';
import { formFieldId } from '@/lib/form-field-id';
import { ResumeSectionContentEditor } from './resume-section-content-editor';

type Props = {
  sectionId: ResumeSectionIdValue;
  config: ResumeSectionLayoutConfig | undefined;
  profileSource: ProfileResumeSource | null;
  onChange: (config: ResumeSectionLayoutConfig) => void;
};

function CustomToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2" htmlFor={id}>
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );
}

export function SectionOverridePanel({
  sectionId,
  config,
  profileSource,
  onChange,
}: Props) {
  const source = config?.source ?? 'profile';
  const isCustom = source === 'custom';
  const current = config ?? {};
  const customToggleId = formFieldId('resume-section', sectionId, 'custom');

  const toggleSource = () => {
    if (isCustom) {
      onChange({ ...current, source: 'profile' });
      return;
    }
    if (profileSource) {
      onChange(seedSectionAsCustom(sectionId, current, profileSource));
      return;
    }
    onChange({ ...current, source: 'custom' });
  };

  const setCustom = (patch: ResumeSectionLayoutConfig) => {
    onChange({ ...current, ...patch, source: 'custom' });
  };

  if (sectionId === 'header') {
    return (
      <div className="mt-2 space-y-2 border-t pt-2 text-sm">
        <CustomToggle
          id={customToggleId}
          label="Override header for this resume only"
          checked={isCustom}
          onChange={toggleSource}
        />
        {isCustom ? (
          <div className="grid gap-2">
            <Input
              id={formFieldId('resume-header', 'full-name')}
              name={formFieldId('resume-header', 'full-name')}
              placeholder="Full name"
              value={String(current.fullName ?? '')}
              onChange={(e) => setCustom({ fullName: e.target.value })}
            />
            <Input
              id={formFieldId('resume-header', 'title')}
              name={formFieldId('resume-header', 'title')}
              placeholder="Job title"
              value={String(current.title ?? '')}
              onChange={(e) => setCustom({ title: e.target.value })}
            />
            <Input
              id={formFieldId('resume-header', 'email')}
              name={formFieldId('resume-header', 'email')}
              placeholder="Email"
              value={String(current.email ?? '')}
              onChange={(e) => setCustom({ email: e.target.value })}
            />
            <Input
              id={formFieldId('resume-header', 'phone')}
              name={formFieldId('resume-header', 'phone')}
              placeholder="Phone"
              value={String(current.phone ?? '')}
              onChange={(e) => setCustom({ phone: e.target.value })}
            />
            <Input
              id={formFieldId('resume-header', 'location')}
              name={formFieldId('resume-header', 'location')}
              placeholder="Location"
              value={String(current.location ?? '')}
              onChange={(e) => setCustom({ location: e.target.value })}
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Uses profile name, job title, and contact from profile identity.
          </p>
        )}
      </div>
    );
  }

  if (sectionId === 'skills') {
    return (
      <div className="mt-2 space-y-2 border-t pt-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            id={formFieldId('resume-skills', 'show-bullets')}
            name={formFieldId('resume-skills', 'show-bullets')}
            type="checkbox"
            checked={current.showBullets !== false}
            onChange={() =>
              onChange({
                ...current,
                showBullets: current.showBullets === false,
              })
            }
          />
          Show bullet points on resume
        </label>
        <CustomToggle
          id={customToggleId}
          label="Custom content for this resume (not profile)"
          checked={isCustom}
          onChange={toggleSource}
        />
        {!isCustom ? (
          <p className="text-xs text-muted-foreground">
            Skills and categories come from the linked profile. Enable custom to
            edit items and categories for this resume only.
          </p>
        ) : (
          <ResumeSectionContentEditor
            sectionId={sectionId}
            config={current}
            profileSource={profileSource}
            onChange={setCustom}
          />
        )}
      </div>
    );
  }

  if (sectionId === 'links') {
    const linksPlacement =
      current.linksPlacement === 'header' ? 'header' : 'section';
    return (
      <div className="mt-2 space-y-2 border-t pt-2 text-sm">
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground">
            Link placement
          </legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={formFieldId('resume-links', 'placement')}
              checked={linksPlacement === 'section'}
              onChange={() => onChange({ ...current, linksPlacement: 'section' })}
            />
            Show links in links section
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={formFieldId('resume-links', 'placement')}
              checked={linksPlacement === 'header'}
              onChange={() => onChange({ ...current, linksPlacement: 'header' })}
            />
            Show links in header (URL only, below contact)
          </label>
        </fieldset>
        <CustomToggle
          id={customToggleId}
          label="Custom content for this resume (not profile)"
          checked={isCustom}
          onChange={toggleSource}
        />
        {!isCustom ? (
          <p className="text-xs text-muted-foreground">
            Links come from the linked profile. Header placement shows bare URLs
            without labels below contact details.
          </p>
        ) : (
          <ResumeSectionContentEditor
            sectionId={sectionId}
            config={current}
            profileSource={profileSource}
            onChange={setCustom}
          />
        )}
      </div>
    );
  }

  if (sectionId === 'summary') {
    const summaryFieldId = formFieldId('resume-summary', 'text');
    return (
      <div className="mt-2 space-y-2 border-t pt-2 text-sm">
        <CustomToggle
          id={customToggleId}
          label="Custom summary for this resume"
          checked={isCustom}
          onChange={toggleSource}
        />
        {isCustom ? (
          <textarea
            id={summaryFieldId}
            name={summaryFieldId}
            className="w-full rounded border p-2 text-sm"
            rows={3}
            value={String(current.text ?? '')}
            onChange={(e) => setCustom({ text: e.target.value })}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Pulls summary from profile identity when available.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2 border-t pt-2 text-sm">
      <CustomToggle
        id={customToggleId}
        label="Custom content for this resume (not profile)"
        checked={isCustom}
        onChange={toggleSource}
      />
      {!isCustom ? (
        <p className="text-xs text-muted-foreground">
          Section data is loaded from the linked profile. Enabling custom copies
          profile content into this resume only.
        </p>
      ) : (
        <ResumeSectionContentEditor
          sectionId={sectionId}
          config={current}
          profileSource={profileSource}
          onChange={setCustom}
        />
      )}
    </div>
  );
}
