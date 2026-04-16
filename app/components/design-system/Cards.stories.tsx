import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENIE_CSS, GDS_WRAPPER_STYLE, useGenieFonts } from './_genie-css';
import {
  AssistantCard,
  InsightCard,
  TaskCard,
  MediaPreviewCard,
} from '@vault/ui';

function CardsSection() {
  useGenieFonts();
  return (
    <div className="gds-root" style={GDS_WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
      <section className="section" id="cards">
        <div className="section-header">
          <span className="section-number">11</span>
          <h2 className="section-title">
            Card <em>Objects</em>
          </h2>
          <p className="section-desc">
            Cards are the primary information unit. Every AI output becomes one
            of these.
          </p>
        </div>

        <div className="card-grid">
          {/* Assistant card */}
          <AssistantCard
            label="Genie"
            subtitle="Just now"
            avatar={
              <div
                className="card-avatar"
                style={{ background: 'var(--grad-lime-mint)' }}
              >
                ✦
              </div>
            }
            content="Here's a summary of the three open design decisions. The surface model uses four opacity tiers, all with backdrop blur."
            actions={
              <>
                {['Copy', 'Expand', 'Pin'].map((a) => (
                  <button
                    key={a}
                    type="button"
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--text-tertiary)',
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                    }}
                  >
                    {a}
                  </button>
                ))}
              </>
            }
          />

          {/* Media preview card */}
          <MediaPreviewCard
            src=""
            alt="Brand visual — nature study"
            type="image"
            caption="Brand visual — nature study"
            size="Generated · 1024 × 1024 · PNG"
            thumb="🌿"
          />

          {/* Insight card */}
          <InsightCard
            icon="📈"
            label="Sprint velocity ↑ this week"
            value="94%"
            trend="up"
            accentColor="mint"
            progress={94}
          />

          {/* Task card */}
          <TaskCard
            title="Finalize Genie token spec"
            cardLabel="Active task"
            status="in_progress"
            priority="high"
            due="Fri"
            meta="Review radius + shadow values with the team before shipping."
            progress={60}
          />
        </div>

        {/* Accent tinted cards */}
        <div className="label" style={{ marginTop: 8, marginBottom: 12 }}>
          Accent tints · pastel background, dark text
        </div>
        <div className="card-grid">
          {(
            [
              {
                accentColor: 'mint',
                icon: '✦',
                title: 'Mint card',
                sub: 'Accent · mint',
                body: 'Soft green surface for nature, health, or confirmation contexts.',
              },
              {
                accentColor: 'sky',
                icon: '☁',
                title: 'Sky card',
                sub: 'Accent · sky',
                body: 'Airy blue surface for knowledge, reports, or weather data.',
              },
              {
                accentColor: 'lilac',
                icon: '✿',
                title: 'Lilac card',
                sub: 'Accent · lilac',
                body: 'Soft violet for creative, AI-generated, or imaginative content.',
              },
              {
                accentColor: 'peach',
                icon: '🍑',
                title: 'Peach card',
                sub: 'Accent · peach',
                body: 'Warm orange for warm actions, food, or social content.',
              },
              {
                accentColor: 'rose',
                icon: '🌸',
                title: 'Rose card',
                sub: 'Accent · rose',
                body: 'Soft pink for personal, wellness, or favourited content.',
              },
              {
                accentColor: 'sun',
                icon: '☀',
                title: 'Sun card',
                sub: 'Accent · sun',
                body: 'Warm yellow for highlights, tips, or featured information.',
              },
              {
                accentColor: 'aqua',
                icon: '💧',
                title: 'Aqua card',
                sub: 'Accent · aqua',
                body: 'Cool cyan for analytics, code, or technical overviews.',
              },
              {
                accentColor: 'lime',
                icon: '🌿',
                title: 'Lime card',
                sub: 'Accent · lime',
                body: 'Vibrant green for growth metrics or environmental context.',
              },
            ] as const
          ).map((c) => (
            <AssistantCard
              key={c.accentColor}
              tinted
              accentColor={c.accentColor}
              label={c.title}
              subtitle={c.sub}
              avatar={
                <div
                  className="card-avatar"
                  style={{ background: `var(--a-${c.accentColor})` }}
                >
                  {c.icon}
                </div>
              }
              content={c.body}
            />
          ))}
        </div>

        {/* Semantic status cards */}
        <div className="label" style={{ marginTop: 16, marginBottom: 12 }}>
          Semantic status · accessible text on tinted glass
        </div>
        <div className="card-grid">
          {(
            [
              {
                status: 'info',
                title: 'Info card',
                body: 'Contextual notice or neutral system message. No action required.',
              },
              {
                status: 'success',
                title: 'Success card',
                body: 'Confirmed completion or positive outcome. Task resolved.',
              },
              {
                status: 'warning',
                title: 'Warning card',
                body: 'Soft alert — review recommended before proceeding.',
              },
              {
                status: 'danger',
                title: 'Danger card',
                body: 'Destructive action or critical failure. Explicit confirmation needed.',
              },
            ] as const
          ).map((c) => (
            <AssistantCard
              key={c.status}
              status={c.status}
              label={c.title}
              content={c.body}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof CardsSection> = {
  title: 'UI / Tokens / Cards',
  component: CardsSection,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof CardsSection>;

export const Default: Story = {};
