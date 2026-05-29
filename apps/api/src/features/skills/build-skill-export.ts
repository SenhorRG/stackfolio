import type { Skill } from '@prisma/client';
import { mapSkillResponse } from './map-skill-response';

export const SKILL_EXPORT_VERSION = 1 as const;

export type SkillExportPayload = {
  exportedAt: string;
  version: typeof SKILL_EXPORT_VERSION;
  count: number;
  skills: Array<
    ReturnType<typeof mapSkillResponse> & {
      createdAt: string;
      updatedAt: string;
    }
  >;
};

export function buildSkillExportPayload(rows: Skill[]): SkillExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    version: SKILL_EXPORT_VERSION,
    count: rows.length,
    skills: rows.map((row) => ({
      ...mapSkillResponse(row),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}
