export const CHAT_ACCENTS = [
  'mint',
  'lime',
  'aqua',
  'sky',
  'lilac',
  'peach',
  'rose',
  'sun',
] as const;

export type ChatAccentColor = (typeof CHAT_ACCENTS)[number];

export type ChatRuntimeState = 'idle' | 'running' | 'degraded' | 'error';

export const CHAT_ACCENT_TOKENS: Record<ChatAccentColor, string> = {
  mint: 'var(--a-mint)',
  lime: 'var(--a-lime)',
  aqua: 'var(--a-aqua)',
  sky: 'var(--a-sky)',
  lilac: 'var(--a-lilac)',
  peach: 'var(--a-peach)',
  rose: 'var(--a-rose)',
  sun: 'var(--a-sun)',
};

export const CHAT_RUNTIME_STATE_ACCENTS: Record<ChatRuntimeState, ChatAccentColor> =
  {
    idle: 'lilac',
    running: 'sky',
    degraded: 'sun',
    error: 'rose',
  };
