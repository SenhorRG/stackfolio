export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certificates'
  | 'projects'
  | 'languages';

const HEADER_TO_SECTION: Record<string, SectionKey> = {
  summary: 'summary',
  profile: 'summary',
  about: 'summary',
  objective: 'summary',
  resumo: 'summary',
  perfil: 'summary',
  objetivo: 'summary',
  apresentação: 'summary',
  apresentacao: 'summary',
  'professional summary': 'summary',
  'resumo profissional': 'summary',

  experience: 'experience',
  'work experience': 'experience',
  employment: 'experience',
  'professional experience': 'experience',
  experiência: 'experience',
  experiencia: 'experience',
  'experiência profissional': 'experience',
  'experiencia profissional': 'experience',
  'histórico profissional': 'experience',
  'historico profissional': 'experience',
  'trajetória profissional': 'experience',
  'trajetoria profissional': 'experience',
  carreira: 'experience',
  'experiencia laboral': 'experience',

  education: 'education',
  formação: 'education',
  formacao: 'education',
  educação: 'education',
  educacao: 'education',
  escolaridade: 'education',
  academic: 'education',
  'formação acadêmica': 'education',
  'formacao academica': 'education',

  skills: 'skills',
  'core skills': 'skills',
  'tech stack': 'skills',
  'core stack': 'skills',
  technologies: 'skills',
  expertise: 'skills',
  'professional skills': 'skills',
  'competências/habilidades': 'skills',
  'competencias/habilidades': 'skills',
  'competencias e habilidades': 'skills',
  'technical skills': 'skills',
  'technical skill': 'skills',
  habilidades: 'skills',
  competências: 'skills',
  competencias: 'skills',
  conhecimentos: 'skills',
  'principais competencias': 'skills',
  'principais competências': 'skills',
  'habilidades técnicas': 'skills',
  'habilidades tecnicas': 'skills',
  stack: 'skills',
  tecnologias: 'skills',

  certifications: 'certificates',
  certificates: 'certificates',
  certificados: 'certificates',
  certificações: 'certificates',
  certificacoes: 'certificates',

  projects: 'projects',
  projetos: 'projects',

  languages: 'languages',
  idiomas: 'languages',
};

const SECTION_HEADER_PATTERN = new RegExp(
  `^(${Object.keys(HEADER_TO_SECTION)
    .sort((a, b) => b.length - a.length)
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})\\s*:?\\s*$`,
  'i',
);

function normalizeHeaderKey(line: string): string {
  return line
    .replace(/:$/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

export function isSectionHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  if (SECTION_HEADER_PATTERN.test(trimmed)) return true;
  const key = normalizeHeaderKey(trimmed);
  return key in HEADER_TO_SECTION;
}

export function mapSectionHeader(line: string): SectionKey | null {
  const key = normalizeHeaderKey(line);
  return HEADER_TO_SECTION[key] ?? null;
}

export function findFirstSectionIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (!isSectionHeaderLine(lines[i])) continue;
    const section = mapSectionHeader(lines[i]);
    if (section === 'languages' && i < 18) continue;
    if (section === 'skills' && i < 12) continue;
    return i;
  }
  return lines.length;
}
