const PROSE_HINT =
  /\b(with|years?|experience|experiência|experiencia|building|desenvolvimento|utilizando|aplicar|proven|strong|expertise|anos?\s+de|mais\s+de|ability|ability|scalable|robust|oriented|focused|profissional\s+com)\b/i;

const META_LABEL_RE =
  /^(data\s+de\s+nascimento|idade|casado|solteiro|contato|contact|endere[cç]o|objetivo\s*$|compet[eê]ncias\/habilidades)/i;

const BIRTH_DATE_RE = /^data\s+de\s+nascimento\s*:/i;

export function isProseLine(line: string): boolean {
  if (line.length > 72) return true;
  if (line.endsWith('.') && line.split(/\s+/).length > 6) return true;
  if (PROSE_HINT.test(line) && line.split(/\s+/).length >= 5) return true;
  return false;
}

export function isMetaLabelLine(line: string): boolean {
  return META_LABEL_RE.test(line.trim()) || BIRTH_DATE_RE.test(line.trim());
}
