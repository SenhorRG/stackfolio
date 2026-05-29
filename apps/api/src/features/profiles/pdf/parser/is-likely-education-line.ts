const EDU_KEYWORD_RE =
  /\b(university|universidade|faculdade|college|bacharelado|graduação|graduacao|pós|pos\s+gradua|technologist|technologist degree|curso\s+técnico|curso\s+tecnico|ensino\s+técnico|ensino\s+tecnico|técnologo|tecnologo|certifica|módulo|modulo|trabalho volunt)\b/i;

const EDU_INSTITUTION_RE =
  /\b(unicesumar|senac|usp|ufmg|ibmec|metrocamp|unicamp)\b/i;

export function isLikelyEducationLine(line: string): boolean {
  const trimmed = line.trim();
  if (EDU_KEYWORD_RE.test(trimmed)) return true;
  if (EDU_INSTITUTION_RE.test(trimmed) && !/\b(engineer|developer|desenvolvedor)\b/i.test(trimmed)) {
    return true;
  }
  return false;
}
