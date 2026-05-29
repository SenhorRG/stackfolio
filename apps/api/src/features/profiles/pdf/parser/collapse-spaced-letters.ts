/** "P R O F E S S I O N A L" → "PROFESSIONAL" */
export function collapseSpacedLetters(line: string): string {
  const trimmed = line.trim();
  if (!/^(?:[A-Za-zÀ-ÿ]\s+){3,}[A-Za-zÀ-ÿ]\s*$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.replace(/\s+/g, '');
}

export function isSpacedLetterFragment(line: string): boolean {
  const collapsed = collapseSpacedLetters(line);
  return collapsed !== line.trim() && collapsed.length <= 24;
}
