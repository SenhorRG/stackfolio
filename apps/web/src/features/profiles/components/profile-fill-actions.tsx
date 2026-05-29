'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { ConfirmReplaceProfileModal } from './confirm-replace-profile-modal';
import { clientProfileHasFilledData } from '../utils/profile-has-filled-data-client';

type Props = {
  profileId: string;
  token: string;
  isMain: boolean;
  profileData: unknown;
  skillsCount: number;
  onSynced?: () => void;
  compact?: boolean;
};

export function ProfileFillActions({
  profileId,
  token,
  isMain,
  profileData,
  skillsCount,
  onSynced,
  compact = false,
}: Props) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);

  const hasData = clientProfileHasFilledData({ profileData, skillsCount });

  const copyFromMain = useMutation({
    mutationFn: () =>
      apiFetch(`/profiles/${profileId}/copy-from-main`, {
        method: 'POST',
        token,
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      setMessage('Profile synced with main profile.');
      setConfirmSyncOpen(false);
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      onSynced?.();
    },
    onError: (err: Error) => {
      setMessage(err.message);
      setConfirmSyncOpen(false);
    },
  });

  const requestSync = () => {
    setMessage(null);
    if (hasData) {
      setConfirmSyncOpen(true);
      return;
    }
    copyFromMain.mutate();
  };

  if (isMain) {
    return null;
  }

  const content = (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={copyFromMain.isPending}
        onClick={requestSync}
      >
        Sync with Main Profile
      </Button>

      {message && (
        <p
          className={
            compact
              ? 'w-full basis-full text-sm text-muted-foreground'
              : 'text-sm text-muted-foreground'
          }
          role="status"
        >
          {message}
        </p>
      )}

      <ConfirmReplaceProfileModal
        open={confirmSyncOpen}
        title="Replace profile data?"
        description="This profile already has data. Syncing with the main profile will replace identity fields and skills."
        confirmLabel="Replace and sync"
        pending={copyFromMain.isPending}
        onCancel={() => setConfirmSyncOpen(false)}
        onConfirm={() => copyFromMain.mutate()}
      />
    </>
  );

  if (compact) {
    return content;
  }

  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">
        Sync identity and skills from your main profile.
      </p>
      {content}
    </section>
  );
}
