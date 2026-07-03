export type LinkButtonVariant = 'primary' | 'secondary';

export const linkButtonClass: Record<LinkButtonVariant, string> = {
  primary:
    'inline-flex items-center rounded-lg bg-[color-mix(in_srgb,var(--a-mint)_20%,transparent)] px-4 py-2 text-sm font-medium text-[var(--text-success)] transition hover:bg-[color-mix(in_srgb,var(--a-mint)_30%,transparent)]',
  secondary:
    'inline-flex items-center rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surf-utility)]',
};
