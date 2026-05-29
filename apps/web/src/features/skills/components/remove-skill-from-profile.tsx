'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

type RemoveSkillFromProfileProps = {
  profileId: string;
  skillId: string;
  skillName: string;
  token: string;
};

export function RemoveSkillFromProfile({
  profileId,
  skillId,
  skillName,
  token,
}: RemoveSkillFromProfileProps) {
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/profiles/${profileId}/skills/${skillId}`, {
        method: 'DELETE',
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="shrink-0 text-destructive"
      disabled={removeMutation.isPending}
      onClick={() => removeMutation.mutate()}
      aria-label={`Remove ${skillName} from profile`}
    >
      Remove
    </Button>
  );
}
