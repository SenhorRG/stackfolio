export function formatPhoneDisplay(raw?: string): string {
  if (!raw?.trim()) return '—';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return raw.trim();

  const country = digits.length > 11 ? digits.slice(0, digits.length - 11) : '';
  const rest = country ? digits.slice(-11) : digits.slice(-11);
  const ddd = rest.slice(0, 2);
  const first = rest.length > 10 ? rest[2] : rest[2];
  const mid = rest.length > 10 ? rest.slice(3, 7) : rest.slice(2, 6);
  const last = rest.length > 10 ? rest.slice(7) : rest.slice(6);

  const prefix = country ? `+${country} ` : '+';
  return `${prefix}(${ddd}) ${first} ${mid}-${last}`;
}

export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (!digits.length) return '';

  let out = '+';
  if (digits.length > 0) out += digits.slice(0, 2);
  if (digits.length > 2) out += ` (${digits.slice(2, 4)}`;
  if (digits.length > 4) out += `) ${digits[4]}`;
  if (digits.length > 5) out += ` ${digits.slice(5, 9)}`;
  if (digits.length > 9) out += `-${digits.slice(9, 13)}`;
  return out;
}
