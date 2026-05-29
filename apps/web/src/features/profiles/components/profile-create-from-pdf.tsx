'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiUpload } from '@/lib/api-upload';
import { Button } from '@/components/ui/button';

type Profile = { id: string };

type CreateFromPdfResult = {
  profile: Profile;
  warnings: string[];
};

type Props = {
  profileName: string;
  token: string;
  disabled?: boolean;
  onCreated: (profileId: string) => void;
};

export function ProfileCreateFromPdf({
  profileName,
  token,
  disabled,
  onCreated,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('name', profileName.trim());
      form.append('file', file);
      return apiUpload<CreateFromPdfResult>('/profiles/from-pdf', form, token);
    },
    onSuccess: (result) => {
      setWarnings(result.warnings ?? []);
      onCreated(result.profile.id);
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.type !== 'application/pdf') {
            setError('Please choose a PDF file.');
            return;
          }
          setError(null);
          createMutation.mutate(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled || createMutation.isPending || !profileName.trim()}
        onClick={() => inputRef.current?.click()}
      >
        {createMutation.isPending ? 'Importing PDF…' : 'Copy from PDF (beta)'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {warnings.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-amber-700">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
