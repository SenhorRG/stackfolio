export function stripJsonNulls(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) {
    return value.map(stripJsonNulls);
  }
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(source)) {
      const stripped = stripJsonNulls(entry);
      if (stripped !== undefined) {
        result[key] = stripped;
      }
    }
    return result;
  }
  return value;
}
