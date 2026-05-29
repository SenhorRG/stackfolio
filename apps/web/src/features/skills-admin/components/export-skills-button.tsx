'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { downloadSkillsExport } from '../lib/download-skills-export';

type Props = {
  token?: string;
};

export function ExportSkillsButton({ token }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!token) return;
    setError(null);
    setIsExporting(true);
    try {
      await downloadSkillsExport(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!token || isExporting}
        onClick={handleExport}
      >
        {isExporting ? 'Exporting…' : 'Export JSON'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
