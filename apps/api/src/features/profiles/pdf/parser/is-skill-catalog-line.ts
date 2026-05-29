const SKILL_CATEGORY_PREFIX =
  /^(core stack|programming languages|frontend|backend|mobile|databases(?:\s*&\s*search)?|messaging(?:\s*&\s*streaming)?|cloud(?:\s*&\s*infrastructure)?|devops(?:\s*&\s*ci\/cd)?|observability|testing(?:\s*&\s*quality)?|architecture(?:\s*&\s*patterns)?|tools(?:\s*&\s*automation)?|ai\s*&|design\s*&|hard skills|process skills|infrastructure skills|architecture skills|devsecops skills|devops skills|soft skills|infraestructure skills)\s*:/i;

const SKILL_INLINE_HEADER =
  /^(skills|technical skills|habilidades|competências|competencias|stack|tecnologias|tech stack|core skills)\s*:/i;

export function isSkillCatalogLine(line: string): boolean {
  const trimmed = line.trim();
  if (SKILL_CATEGORY_PREFIX.test(trimmed)) return true;
  if (SKILL_INLINE_HEADER.test(trimmed)) return true;
  return false;
}
