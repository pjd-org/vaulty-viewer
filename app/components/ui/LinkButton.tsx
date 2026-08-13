export type LinkButtonVariant = 'primary' | 'secondary';

export const linkButtonClass: Record<LinkButtonVariant, string> = {
  primary:
    'inline-flex items-center rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-200',
  secondary:
    'inline-flex items-center rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-primary)] transition hover:bg-[var(--surf-utility)]',
};
