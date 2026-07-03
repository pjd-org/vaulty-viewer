import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function PrinciplesSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="principles">
        <div className="section-header">
          <span className="section-number">01</span>
          <h2 className="section-title">
            Design <em>Principles</em>
          </h2>
          <p className="section-desc">
            Four rules that define every decision in this system.
          </p>
        </div>
        <div className="principles-grid">
          {[
            {
              num: 'P1',
              title: 'AI outputs are objects, not paragraphs',
              body: 'Responses become cards, previews, file tiles, suggestion chips, and expandable result modules — never a wall of text.',
            },
            {
              num: 'P2',
              title: 'Reduce cognitive load through grouping',
              body: 'Everything clusters: primary action, active conversation, related assets, smart suggestions. Four zones, always.',
            },
            {
              num: 'P3',
              title: 'Depth without heaviness',
              body: 'Depth via blur, layered opacity, slight scaling, soft shadows, tinted gradients. Never thick borders or dark shadows.',
            },
            {
              num: 'P4',
              title: 'Calm interaction model',
              body: 'Every state transition: soft, predictable, springy, short but not snappy. No abrupt cuts. No bounce on utility flows.',
            },
          ].map((p) => (
            <div key={p.num} className="principle-card glass">
              <div className="principle-num">{p.num}</div>
              <div className="principle-title">{p.title}</div>
              <div className="principle-body">{p.body}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof PrinciplesSection> = {
  title: 'UI / Tokens / Principles',
  component: PrinciplesSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof PrinciplesSection>;

export const Default: Story = {};
