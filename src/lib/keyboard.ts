import type { KeyboardEvent } from 'react';

export function isActivationKey(event: Pick<KeyboardEvent, 'key'>): boolean {
  return event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
}

export function activateOnKeyboardEvent(
  event: KeyboardEvent,
  action: () => void
): boolean {
  if (!isActivationKey(event)) return false;
  event.preventDefault();
  action();
  return true;
}
