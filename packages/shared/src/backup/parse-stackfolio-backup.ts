import {
  stackfolioBackupSchema,
  type StackfolioBackup,
} from './stackfolio-backup-schema';

export type ParseBackupResult =
  | { success: true; data: StackfolioBackup }
  | { success: false; message: string };

export function parseStackfolioBackup(raw: unknown): ParseBackupResult {
  const parsed = stackfolioBackupSchema.safeParse(raw);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  const first = parsed.error.issues[0];
  const path = first?.path.join('.') ?? 'backup';
  const message = first?.message ?? 'Invalid backup file';
  return { success: false, message: `${path}: ${message}` };
}
