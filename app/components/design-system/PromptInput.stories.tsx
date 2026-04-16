import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';
import { PromptInput } from '@vault/ui';

function PromptInputSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="input">
        <div className="section-header">
          <span className="section-number">10</span>
          <h2 className="section-title">
            Prompt <em>Input</em>
          </h2>
          <p className="section-desc">
            Large pill. Soft inset feel. Active glow ring on focus. Supports
            text, voice, attachments.
          </p>
        </div>
        <div className="component-canvas">
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              alignItems: 'flex-start',
              width: '100%',
            }}
          >
            {/* Default (empty) state */}
            <PromptInput
              style={{ width: 440, maxWidth: '100%' }}
              placeholder="Ask anything or describe what you need…"
              leadingIcon="✦"
            />
            {/* Focused/active state — glow ring + gradient send button */}
            <PromptInput
              style={{ width: 440, maxWidth: '100%' }}
              value="Summarize the latest design decisions"
              onChange={() => undefined}
              leadingIcon="✦"
              active
            />
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-tertiary)',
                fontFamily: "'Geist Mono', monospace",
              }}
            >
              ↑ default · focused (with active ring)
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof PromptInputSection> = {
  title: 'UI / Tokens / Prompt Input',
  component: PromptInputSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof PromptInputSection>;

export const Default: Story = {};
