'use client';

import { CardMenu } from '@/components/layout/card-menu';

type ResumeCardMenuProps = {
  projectName: string;
  onDuplicate: () => void;
  onDelete: () => void;
  isPending?: boolean;
};

export function ResumeCardMenu({
  projectName,
  onDuplicate,
  onDelete,
  isPending,
}: ResumeCardMenuProps) {
  return (
    <CardMenu
      ariaLabel="Resume options"
      items={[
        {
          label: 'Duplicate',
          disabled: isPending,
          onClick: onDuplicate,
        },
        {
          label: 'Delete',
          destructive: true,
          disabled: isPending,
          onClick: () => {
            if (
              window.confirm(
                `Delete "${projectName}"? This cannot be undone.`,
              )
            ) {
              onDelete();
            }
          },
        },
      ]}
    />
  );
}
