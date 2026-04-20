import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from '../_genie-css';
import { SuggestionChip } from '@vault/ui/molecules';

function ChipsSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="chips">
        <div className="section-header">
          <span className="section-number">09</span>
          <h2 className="section-title">
            Suggestion <em>Chips</em>
          </h2>
          <p className="section-desc">
            Inline prompt suggestions. Low visual weight, high discoverability.
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
            }}
          >
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                Default state
              </div>
              <div className="chip-row">
                {[
                  '✦ Summarize this',
                  '↩ Rewrite',
                  '⚡ Extract tasks',
                  '🖼 Generate image',
                  '📎 Attach file',
                ].map((c) => (
                  <SuggestionChip unstyled key={c} className="chip">
                    {c}
                  </SuggestionChip>
                ))}
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                Active state
              </div>
              <div className="chip-row">
                <SuggestionChip unstyled className="chip active">
                  ✦ Summarize this
                </SuggestionChip>
                <SuggestionChip unstyled className="chip">
                  ↩ Rewrite
                </SuggestionChip>
                <SuggestionChip unstyled className="chip">
                  ⚡ Extract tasks
                </SuggestionChip>
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                Accent tints
              </div>
              <div className="chip-row">
                {(
                  [
                    { color: 'mint', label: '✦ Mint' },
                    { color: 'lime', label: '🌿 Lime' },
                    { color: 'aqua', label: '💧 Aqua' },
                    { color: 'sky', label: '☁ Sky' },
                    { color: 'lilac', label: '✿ Lilac' },
                    { color: 'peach', label: '🍑 Peach' },
                    { color: 'rose', label: '🌸 Rose' },
                    { color: 'sun', label: '☀ Sun' },
                  ] as const
                ).map((c) => (
                  <SuggestionChip
                    key={c.color}
                    unstyled
                    className={`chip chip-${c.color}`}
                  >
                    {c.label}
                  </SuggestionChip>
                ))}
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                Semantic states
              </div>
              <div className="chip-row">
                <SuggestionChip unstyled className="chip chip-info">
                  ℹ Info
                </SuggestionChip>
                <SuggestionChip unstyled className="chip chip-success">
                  ✓ Success
                </SuggestionChip>
                <SuggestionChip unstyled className="chip chip-warning">
                  ⚠ Warning
                </SuggestionChip>
                <SuggestionChip unstyled className="chip chip-danger">
                  ✕ Danger
                </SuggestionChip>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof ChipsSection> = {
  title: 'UI / Tokens / Chips',
  component: ChipsSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof ChipsSection>;

export const Default: Story = {};
