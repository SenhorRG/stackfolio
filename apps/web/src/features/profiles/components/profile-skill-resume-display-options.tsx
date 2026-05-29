'use client';

import { ProfileSkillToggleSwitch } from '@/features/profiles/components/profile-skill-toggle-switch';

type Props = {
  showLevel: boolean;
  showYears: boolean;
  disabled?: boolean;
  onShowLevelChange: (value: boolean) => void;
  onShowYearsChange: (value: boolean) => void;
};

export function ProfileSkillResumeDisplayOptions({
  showLevel,
  showYears,
  disabled,
  onShowLevelChange,
  onShowYearsChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-lg border bg-muted/20 p-4">
      <label className="flex items-center gap-3 text-sm">
        <ProfileSkillToggleSwitch
          checked={showLevel}
          disabled={disabled}
          label="Show level on resume"
          onCheckedChange={onShowLevelChange}
        />
        <span>
          <span className="font-medium">Show level</span>
          <span className="block text-muted-foreground">
            Display skill level on the resume.
          </span>
        </span>
      </label>
      <label className="flex items-center gap-3 text-sm">
        <ProfileSkillToggleSwitch
          checked={showYears}
          disabled={disabled}
          label="Show years on resume"
          onCheckedChange={onShowYearsChange}
        />
        <span>
          <span className="font-medium">Show years</span>
          <span className="block text-muted-foreground">
            Display years of experience on the resume.
          </span>
        </span>
      </label>
    </div>
  );
}
