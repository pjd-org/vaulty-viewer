export function normalizeReturnTo(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '/';
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  if (trimmed.includes('\\')) return '/';
  return trimmed;
}

export function buildAuthTransitionPath(returnTo: string): string {
  return `/?auth=required&return_to=${encodeURIComponent(
    normalizeReturnTo(returnTo)
  )}`;
}
