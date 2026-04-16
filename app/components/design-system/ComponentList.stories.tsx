import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';

function ComponentListSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="inventory">
        <div className="section-header">
          <span className="section-number">15</span>
          <h2 className="section-title">
            v1 Component <em>Inventory</em>
          </h2>
          <p className="section-desc">
            Build in this order: tokens → primitives → shell → card objects →
            motion.
          </p>
        </div>
        <div className="inventory-grid">
          {[
            'AppShell',
            'GlassCard',
            'Button',
            'IconButton',
            'Chip',
            'Composer',
            'AssistantCard',
            'MediaPreviewCard',
            'FileCard',
            'SidebarRail',
            'ProfileBubble',
            'FloatingDock',
            'SectionHeader',
            'LoadingCard',
            'ToastSoft',
          ].map((item, i) => (
            <div key={item} className="inventory-item">
              <span className="inventory-num">
                {String(i + 1).padStart(2, '0')}
              </span>
              {item}
            </div>
          ))}
        </div>

        <div
          className="glass"
          style={{
            padding: 28,
            marginTop: 8,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--grad-card-glow)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 22,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              The real identity
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                maxWidth: 520,
              }}
            >
              This is not a glassmorphism kit. The coating is glass — the system
              underneath is a{' '}
              <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                soft AI workspace
              </strong>
              , card-native interaction, ambient gradients, calm productivity
              motion, and low-friction object-based conversation UI. That's the
              reusable part.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof ComponentListSection> = {
  title: 'UI / Tokens / Component List',
  component: ComponentListSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentListSection>;

export const Default: Story = {};
