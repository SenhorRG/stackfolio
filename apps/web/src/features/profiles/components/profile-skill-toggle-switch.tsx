'use client';

type Props = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

export function ProfileSkillToggleSwitch({
  checked,
  disabled,
  label,
  onCheckedChange,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'border-primary bg-primary' : 'border-input bg-muted'
      }`}
    >
      <span
        className={`pointer-events-none block size-5 rounded-full bg-background shadow transition-transform ${
          checked ? 'translate-x-[1.35rem]' : 'translate-x-0.5'
        } mt-0.5`}
      />
    </button>
  );
}
