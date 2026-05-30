import type { StackfolioBackup } from '@stackfolio/shared';

export function downloadBackupJson(
  backup: StackfolioBackup,
  filename = 'stackfolio-backup.json',
): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
