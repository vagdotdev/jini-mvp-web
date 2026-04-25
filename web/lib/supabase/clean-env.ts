/**
 * Dashboard pastes often include trailing newlines or wrapping quotes.
 */
export function cleanSupabaseEnvValue(value: string | undefined): string {
  if (!value) return "";
  let s = value.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}
