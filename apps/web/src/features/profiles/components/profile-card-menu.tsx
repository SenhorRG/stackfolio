'use client';

import { CardMenu } from '@/components/layout/card-menu';

type ProfileCardMenuProps = {
  profileId: string;
  profileName: string;
  isMain: boolean;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  isPending?: boolean;
};

export function ProfileCardMenu({
  profileId,
  profileName,
  isMain,
  onDuplicate,
  onDelete,
  isPending,
}: ProfileCardMenuProps) {
  if (isMain) return null;

  return (
    <CardMenu
      ariaLabel="Profile options"
      items={[
        {
          label: 'Duplicate',
          disabled: isPending,
          onClick: () => onDuplicate(profileId),
        },
        {
          label: 'Delete',
          destructive: true,
          disabled: isPending,
          onClick: () => {
            if (
              window.confirm(
                `Delete "${profileName}" and all associated resumes?`,
              )
            ) {
              onDelete(profileId);
            }
          },
        },
      ]}
    />
  );
}
