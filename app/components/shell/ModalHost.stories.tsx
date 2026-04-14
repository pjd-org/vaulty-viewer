import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ModalHost } from './ModalHost';

/**
 * ModalHost is driven by UIStore.activeModal (a Zustand store).
 * These stories use a controlled render pattern — the modal slot content
 * is passed via the `modals` prop, but opening/closing requires the store.
 *
 * The stories below demonstrate the static chrome: overlay + dialog container.
 * To test open state in Storybook, use the play function or add a mock decorator.
 */

const meta = {
  title: 'Shell / ModalHost',
  component: ModalHost,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ModalHost>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ModalHost renders nothing when activeModal is null (store default).
 * This confirms the empty/idle state renders no DOM.
 */
export const Idle: Story = {
  args: {
    modals: {
      'confirm-action': (
        <div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Confirm action
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Are you sure you want to proceed? This cannot be undone.
          </p>
        </div>
      ),
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Idle state — UIStore.activeModal is null. ModalHost renders nothing.',
      },
    },
  },
};
