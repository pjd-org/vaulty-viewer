import { useEffect } from 'react';

/* ─────────────────────────────────────────────
   Shared CSS for all Genie Design System stories.
   Exact copy of the CSS block from GenieDesignSystem.stories.tsx.
   Import GENIE_CSS and inject via:
     <style dangerouslySetInnerHTML={{ __html: GENIE_CSS }} />
───────────────────────────────────────────── */
export const GENIE_CSS = `
:root {
  --n-0:   #FFFFFF;
  --n-25:  #FCFCFD;
  --n-50:  #F8F8FA;
  --n-100: #F1F2F5;
  --n-150: #E9EBF0;
  --n-200: #DFE3EA;
  --n-300: #C8CFDA;
  --n-400: #AAB4C3;
  --n-500: #8793A6;
  --n-600: #667085;
  --n-700: #4B5565;
  --n-800: #313846;
  --n-900: #1C2230;
  --n-950: #11151D;
  --a-mint:  #B8FFD8;
  --a-lime:  #D9FF8C;
  --a-aqua:  #97F0FF;
  --a-sky:   #A9D7FF;
  --a-lilac: #D8C7FF;
  --a-peach: #FFD2B8;
  --a-rose:  #FFC7DE;
  --a-sun:   #FFF0A6;
  --s-info:    #7CCBFF;
  --s-success: #8EE7A0;
  --s-warning: #FFD66B;
  --s-danger:  #FF8F8F;
  --surf-canvas:   rgba(250,250,252,0.92);
  --surf-base:     rgba(255,255,255,0.72);
  --surf-elevated: rgba(255,255,255,0.82);
  --surf-overlay:  rgba(255,255,255,0.58);
  --border-subtle:  rgba(255,255,255,0.36);
  --border-default: rgba(255,255,255,0.52);
  --border-strong:  rgba(198,205,216,0.7);
  --text-primary:   #1C2230;
  --text-secondary: #4B5565;
  --text-tertiary:  #667085;
  --shadow-xs:   0 2px 8px rgba(17,21,29,0.04);
  --shadow-sm:   0 8px 20px rgba(17,21,29,0.06);
  --shadow-md:   0 16px 40px rgba(17,21,29,0.08);
  --shadow-lg:   0 24px 60px rgba(17,21,29,0.10);
  --shadow-glow: 0 0 0 1px rgba(184,255,216,0.24), 0 12px 40px rgba(184,255,216,0.18);
  --blur-sm: 8px;
  --blur-md: 16px;
  --blur-lg: 24px;
  --blur-xl: 32px;
  --grad-hero:      linear-gradient(135deg, rgba(217,255,140,0.32) 0%, rgba(151,240,255,0.24) 45%, rgba(255,199,222,0.28) 100%);
  --grad-card-glow: radial-gradient(circle at 20% 20%, rgba(184,255,216,0.35), transparent 42%), radial-gradient(circle at 80% 30%, rgba(216,199,255,0.22), transparent 36%), radial-gradient(circle at 60% 80%, rgba(255,210,184,0.18), transparent 32%);
  --grad-mint-sky:  linear-gradient(135deg, #B8FFD8 0%, #A9D7FF 100%);
  --grad-rose-peach:linear-gradient(135deg, #FFC7DE 0%, #FFD2B8 100%);
  --grad-lime-mint: linear-gradient(135deg, #D9FF8C 0%, #B8FFD8 100%);
  --ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-enter:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit:     cubic-bezier(0.7, 0, 0.84, 0);

  /* @vault/ui token aliases */
  --surface-canvas:   var(--surf-canvas);
  --surface-base:     var(--surf-base);
  --surface-elevated: var(--surf-elevated);
  --surface-overlay:  var(--surf-overlay);
  --surface-inverted: rgba(28,34,48,0.92);
  --border-glass-subtle:  var(--border-subtle);
  --border-glass-default: var(--border-default);
  --accent-mint:  var(--a-mint);
  --accent-lime:  var(--a-lime);
  --accent-aqua:  var(--a-aqua);
  --accent-sky:   var(--a-sky);
  --accent-lilac: var(--a-lilac);
  --accent-peach: var(--a-peach);
  --accent-rose:  var(--a-rose);
  --accent-sun:   var(--a-sun);
  --neutral-0:   var(--n-0);
  --neutral-25:  var(--n-25);
  --neutral-50:  var(--n-50);
  --neutral-100: var(--n-100);
  --neutral-150: var(--n-150);
  --neutral-200: var(--n-200);
  --neutral-300: var(--n-300);
  --neutral-400: var(--n-400);
  --neutral-500: var(--n-500);
  --neutral-600: var(--n-600);
  --neutral-700: var(--n-700);
  --neutral-800: var(--n-800);
  --neutral-900: var(--n-900);
  --neutral-950: var(--n-950);
  --color-success: var(--s-success);
  --color-danger:  var(--s-danger);
  --color-warning: var(--s-warning);
  --color-info:    var(--s-info);
  --radius-xs:   10px;
  --radius-sm:   14px;
  --radius-md:   18px;
  --radius-lg:   24px;
  --radius-xl:   28px;
  --radius-2xl:  32px;
  --radius-3xl:  40px;
  --radius-pill: 999px;
  --shadow-glow-mint: var(--shadow-glow);
  --vault-accent: var(--n-900);
  --vault-ink:    var(--text-primary);
  --vault-muted:  var(--text-tertiary);
  --color-text:         var(--text-primary);
  --color-text-2:       var(--text-secondary);
  --color-text-3:       var(--text-tertiary);
  --color-text-inverse: var(--n-0);
}

.text-text   { color: var(--color-text,   var(--text-primary))   !important; }
.text-text-2 { color: var(--color-text-2, var(--text-secondary)) !important; }
.text-text-3 { color: var(--color-text-3, var(--text-tertiary))  !important; }
.rounded-pill { border-radius: var(--radius-pill, 999px) !important; }
.rounded-xl   { border-radius: var(--radius-xl,   28px)  !important; }
.rounded-lg   { border-radius: var(--radius-lg,   24px)  !important; }
.rounded-sm   { border-radius: var(--radius-sm,   14px)  !important; }
.shadow-xs { box-shadow: var(--shadow-xs, 0 2px 8px  rgba(17,21,29,0.04)) !important; }
.shadow-sm { box-shadow: var(--shadow-sm, 0 8px 20px rgba(17,21,29,0.06)) !important; }
.shadow-md { box-shadow: var(--shadow-md, 0 16px 40px rgba(17,21,29,0.08)) !important; }
.bg-neutral-100 { background-color: var(--neutral-100, #F1F2F5) !important; }
.duration-normal { transition-duration: 220ms !important; }
.overflow-hidden { overflow: hidden !important; }

.gds-root *, .gds-root *::before, .gds-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
.gds-root { font-family: 'Geist', -apple-system, system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--text-primary); }

.gds-page-bg {
  position: fixed; inset: 0; z-index: 0;
  background: linear-gradient(160deg, #EEF0F8 0%, #F3F1FB 30%, #EDF5F0 60%, #F5EFF5 100%);
  pointer-events: none;
}
.gds-page-bg::before {
  content: ''; position: absolute; inset: -10%;
  background:
    radial-gradient(ellipse 80% 60% at 10% 5%,  rgba(217,255,140,0.18) 0%, transparent 55%),
    radial-gradient(ellipse 70% 50% at 90% 10%, rgba(151,240,255,0.16) 0%, transparent 55%),
    radial-gradient(ellipse 60% 60% at 80% 85%, rgba(216,199,255,0.18) 0%, transparent 55%),
    radial-gradient(ellipse 50% 50% at 20% 90%, rgba(255,210,184,0.14) 0%, transparent 50%);
}

.section { display: flex; flex-direction: column; gap: 32px; }

.section-header { display: flex; flex-direction: column; gap: 6px; padding-bottom: 20px; border-bottom: 1px solid var(--border-strong); }
.section-number { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-tertiary); }
.section-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 32px; line-height: 1.15; letter-spacing: -0.03em; color: var(--text-primary); }
.section-title em { font-style: italic; color: var(--n-600); }
.section-desc { font-size: 14px; color: var(--text-secondary); max-width: 600px; line-height: 1.7; }

.glass { background: var(--surf-base); border: 1px solid var(--border-default); box-shadow: var(--shadow-md); backdrop-filter: blur(var(--blur-lg)); -webkit-backdrop-filter: blur(var(--blur-lg)); border-radius: 24px; }
.glass-sm { border-radius: 14px; }
.glass-md { border-radius: 18px; }
.glass-elevated { background: var(--surf-elevated); box-shadow: var(--shadow-lg); }

.hero {
  padding: 56px; background: var(--grad-hero);
  border: 1px solid var(--border-default); box-shadow: var(--shadow-lg);
  backdrop-filter: blur(var(--blur-xl)); -webkit-backdrop-filter: blur(var(--blur-xl));
  border-radius: 32px; position: relative; overflow: hidden;
}
.hero::before { content: ''; position: absolute; inset: -30%; background: var(--grad-card-glow); pointer-events: none; }
.hero-tag {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.62); border: 1px solid rgba(255,255,255,0.5);
  border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 500;
  color: var(--text-secondary); letter-spacing: 0.01em; margin-bottom: 20px; width: fit-content;
}
.hero-tag::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--grad-lime-mint); box-shadow: 0 0 0 2px rgba(184,255,216,0.4); }
.hero-display { font-family: 'Instrument Serif', Georgia, serif; font-size: 52px; line-height: 1.1; letter-spacing: -0.035em; color: var(--text-primary); margin-bottom: 16px; }
.hero-display em { font-style: italic; background: var(--grad-mint-sky); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero-body { font-size: 16px; color: var(--text-secondary); max-width: 520px; line-height: 1.7; margin-bottom: 32px; }
.hero-traits { display: flex; gap: 8px; flex-wrap: wrap; }
.hero-trait { background: rgba(255,255,255,0.66); border: 1px solid rgba(255,255,255,0.5); border-radius: 999px; padding: 5px 12px; font-size: 12px; color: var(--text-secondary); font-weight: 500; }

.swatch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
.swatch { display: flex; flex-direction: column; gap: 6px; }
.swatch-color { height: 56px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); transition: transform 220ms var(--ease-enter); }
.swatch-color:hover { transform: scale(1.05); }
.swatch-name { font-size: 11px; color: var(--text-tertiary); font-weight: 500; letter-spacing: 0.01em; }
.swatch-value { font-family: 'Geist Mono', monospace; font-size: 10px; color: var(--text-tertiary); }
.swatch-row { display: flex; gap: 4px; align-items: center; }
.swatch-step { flex: 1; height: 40px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.04); transition: transform 200ms var(--ease-enter); cursor: default; }
.swatch-step:hover { transform: scaleY(1.12); }
.swatch-label-row { display: flex; gap: 4px; margin-top: 6px; }
.swatch-step-label { flex: 1; font-size: 9px; color: var(--text-tertiary); text-align: center; font-family: 'Geist Mono', monospace; }

.gradient-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.gradient-card { height: 120px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.5); position: relative; overflow: hidden; cursor: default; transition: transform 220ms var(--ease-enter), box-shadow 220ms var(--ease-enter); }
.gradient-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.gradient-card-label { position: absolute; bottom: 12px; left: 14px; font-size: 11px; font-weight: 600; color: rgba(28,34,48,0.7); letter-spacing: 0.01em; font-family: 'Geist Mono', monospace; }

.surface-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.surface-demo { padding: 20px; border-radius: 18px; display: flex; flex-direction: column; gap: 8px; border: 1px solid rgba(198,205,216,0.5); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); transition: transform 220ms var(--ease-enter); }
.surface-demo:hover { transform: translateY(-1px); }
.surface-demo-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.surface-demo-value { font-family: 'Geist Mono', monospace; font-size: 10px; color: var(--text-tertiary); line-height: 1.6; }

.type-row { padding: 20px 24px; border-bottom: 1px solid var(--n-150); display: grid; grid-template-columns: 120px 1fr 200px; gap: 16px; align-items: center; }
.type-row:last-child { border-bottom: none; }
.type-token { font-family: 'Geist Mono', monospace; font-size: 11px; color: var(--text-tertiary); }
.type-meta { font-family: 'Geist Mono', monospace; font-size: 10px; color: var(--text-tertiary); line-height: 1.8; }

.token-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
.radius-demo { background: white; border: 1.5px solid var(--border-strong); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 20px 16px; transition: transform 200ms var(--ease-enter); }
.radius-demo:hover { transform: translateY(-1px); }
.radius-box { width: 48px; height: 48px; background: var(--grad-mint-sky); }
.radius-label { font-family: 'Geist Mono', monospace; font-size: 11px; color: var(--text-secondary); text-align: center; }

.shadow-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
.shadow-demo { background: white; border-radius: 16px; padding: 24px 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; border: 1px solid rgba(198,205,216,0.3); }
.shadow-pill { width: 48px; height: 20px; border-radius: 999px; background: var(--n-100); border: 1px solid var(--n-200); }
.shadow-label { font-family: 'Geist Mono', monospace; font-size: 11px; color: var(--text-secondary); }

.component-canvas { padding: 32px; background: var(--surf-canvas); border-radius: 20px; border: 1px solid var(--border-strong); position: relative; overflow: hidden; }
.component-canvas::before { content: ''; position: absolute; inset: 0; background: var(--grad-card-glow); pointer-events: none; }

.btn-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 999px; font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: background-color 200ms var(--ease-standard), transform 200ms var(--ease-standard), box-shadow 200ms var(--ease-standard), color 200ms var(--ease-standard); }
.btn-md { height: 40px; padding: 0 18px; }
.btn-sm { height: 32px; padding: 0 14px; font-size: 12px; }
.btn-lg { height: 48px; padding: 0 22px; font-size: 14px; }
.btn-primary { background: var(--n-900); color: white; box-shadow: var(--shadow-sm); }
.btn-primary:hover { background: var(--n-800); transform: translateY(-1px); box-shadow: var(--shadow-md); }
.btn-secondary { background: rgba(255,255,255,0.72); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.6); box-shadow: var(--shadow-xs); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.btn-secondary:hover { background: rgba(255,255,255,0.88); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: rgba(255,255,255,0.5); color: var(--text-primary); }
.btn-accent { background: var(--grad-lime-mint); color: var(--n-800); box-shadow: var(--shadow-glow); }
.btn-accent:hover { transform: translateY(-1px); box-shadow: 0 0 0 1px rgba(184,255,216,0.4), 0 16px 48px rgba(184,255,216,0.28); }
.btn-mint   { background: var(--a-mint);  color: var(--n-800); box-shadow: 0 4px 16px rgba(184,255,216,0.4); border: none; }
.btn-lime   { background: var(--a-lime);  color: var(--n-800); box-shadow: 0 4px 16px rgba(217,255,140,0.4); border: none; }
.btn-aqua   { background: var(--a-aqua);  color: var(--n-800); box-shadow: 0 4px 16px rgba(151,240,255,0.4); border: none; }
.btn-sky    { background: var(--a-sky);   color: var(--n-800); box-shadow: 0 4px 16px rgba(169,215,255,0.4); border: none; }
.btn-lilac  { background: var(--a-lilac); color: var(--n-800); box-shadow: 0 4px 16px rgba(216,199,255,0.4); border: none; }
.btn-peach  { background: var(--a-peach); color: var(--n-800); box-shadow: 0 4px 16px rgba(255,210,184,0.4); border: none; }
.btn-rose   { background: var(--a-rose);  color: var(--n-800); box-shadow: 0 4px 16px rgba(255,199,222,0.4); border: none; }
.btn-sun    { background: var(--a-sun);   color: var(--n-800); box-shadow: 0 4px 16px rgba(255,240,166,0.4); border: none; }
.btn-mint:hover  { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(184,255,216,0.55); }
.btn-lime:hover  { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(217,255,140,0.55); }
.btn-aqua:hover  { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(151,240,255,0.55); }
.btn-sky:hover   { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(169,215,255,0.55); }
.btn-lilac:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(216,199,255,0.55); }
.btn-peach:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,210,184,0.55); }
.btn-rose:hover  { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,199,222,0.55); }
.btn-sun:hover   { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,240,166,0.55); }
.btn-info    { background: rgba(124,203,255,0.22); color: #2a6590; border: 1px solid rgba(124,203,255,0.4); box-shadow: none; }
.btn-success { background: rgba(142,231,160,0.22); color: #276b38; border: 1px solid rgba(142,231,160,0.4); box-shadow: none; }
.btn-warning { background: rgba(255,214,107,0.28); color: #7a5c00; border: 1px solid rgba(255,214,107,0.5); box-shadow: none; }
.btn-danger  { background: rgba(255,143,143,0.22); color: #8c1f1f; border: 1px solid rgba(255,143,143,0.4); box-shadow: none; }
.btn-info:hover    { background: rgba(124,203,255,0.34); transform: translateY(-1px); }
.btn-success:hover { background: rgba(142,231,160,0.34); transform: translateY(-1px); }
.btn-warning:hover { background: rgba(255,214,107,0.40); transform: translateY(-1px); }
.btn-danger:hover  { background: rgba(255,143,143,0.34); transform: translateY(-1px); }

.chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 999px; background: rgba(255,255,255,0.66); border: 1px solid rgba(255,255,255,0.5); font-size: 12px; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: background-color 180ms var(--ease-standard), box-shadow 180ms var(--ease-standard), color 180ms var(--ease-standard), transform 180ms var(--ease-standard); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
.chip:hover { background: rgba(255,255,255,0.88); color: var(--text-primary); box-shadow: var(--shadow-xs); }
.chip.active { background: rgba(255,255,255,0.88); border-color: rgba(255,255,255,0.8); color: var(--text-primary); box-shadow: var(--shadow-sm); }
.chip-mint   { background: rgba(184,255,216,0.45); border-color: rgba(184,255,216,0.7); color: var(--n-800); }
.chip-lime   { background: rgba(217,255,140,0.45); border-color: rgba(217,255,140,0.7); color: var(--n-800); }
.chip-aqua   { background: rgba(151,240,255,0.45); border-color: rgba(151,240,255,0.7); color: var(--n-800); }
.chip-sky    { background: rgba(169,215,255,0.45); border-color: rgba(169,215,255,0.7); color: var(--n-800); }
.chip-lilac  { background: rgba(216,199,255,0.45); border-color: rgba(216,199,255,0.7); color: var(--n-800); }
.chip-peach  { background: rgba(255,210,184,0.45); border-color: rgba(255,210,184,0.7); color: var(--n-800); }
.chip-rose   { background: rgba(255,199,222,0.45); border-color: rgba(255,199,222,0.7); color: var(--n-800); }
.chip-sun    { background: rgba(255,240,166,0.45); border-color: rgba(255,240,166,0.7); color: var(--n-800); }
.chip-info    { background: rgba(124,203,255,0.18); border-color: rgba(124,203,255,0.4); color: #2a6590; }
.chip-success { background: rgba(142,231,160,0.18); border-color: rgba(142,231,160,0.4); color: #276b38; }
.chip-warning { background: rgba(255,214,107,0.22); border-color: rgba(255,214,107,0.5); color: #7a5c00; }
.chip-danger  { background: rgba(255,143,143,0.18); border-color: rgba(255,143,143,0.4); color: #8c1f1f; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.assistant-card { padding: 20px; position: relative; overflow: hidden; transition: transform 220ms var(--ease-enter), box-shadow 220ms var(--ease-enter); }
.assistant-card::before { content: ''; position: absolute; inset: -30%; background: var(--grad-card-glow); pointer-events: none; }
.assistant-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.card-avatar { width: 32px; height: 32px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; border: 1.5px solid rgba(255,255,255,0.6); box-shadow: var(--shadow-xs); }
.card-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.card-subtitle { font-size: 11px; color: var(--text-tertiary); }
.card-body { font-size: 13px; color: var(--text-secondary); line-height: 1.65; margin-bottom: 14px; }
.card-footer { display: flex; gap: 6px; padding-top: 12px; border-top: 1px solid rgba(198,205,216,0.3); }
.card-action { font-size: 11px; font-weight: 500; color: var(--text-tertiary); padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.4); cursor: pointer; transition: background-color 160ms var(--ease-standard), color 160ms var(--ease-standard), box-shadow 160ms var(--ease-standard), transform 160ms var(--ease-standard); }
.card-action:hover { background: rgba(255,255,255,0.8); color: var(--text-primary); }

.media-card { overflow: hidden; }
.media-thumb { width: 100%; height: 140px; border-radius: 16px 16px 0 0; display: flex; align-items: center; justify-content: center; font-size: 40px; background: var(--grad-hero); border-bottom: 1px solid rgba(198,205,216,0.2); position: relative; overflow: hidden; }
.media-thumb::after { content: ''; position: absolute; inset: 0; background: var(--grad-card-glow); }
.media-info { padding: 14px 16px; }
.media-title { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.media-meta { font-size: 11px; color: var(--text-tertiary); }

.insight-card { padding: 20px; }
.insight-metric { font-family: 'Instrument Serif', Georgia, serif; font-size: 36px; letter-spacing: -0.03em; color: var(--text-primary); margin-bottom: 4px; }
.insight-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-bottom: 14px; }
.insight-bar { height: 4px; border-radius: 999px; background: var(--n-200); overflow: hidden; }
.insight-bar-fill { height: 100%; border-radius: 999px; background: var(--grad-mint-sky); box-shadow: 0 0 8px rgba(184,255,216,0.6); }

.prompt-input-demo { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.88); border: 1px solid rgba(255,255,255,0.62); border-radius: 999px; padding: 0 18px; height: 56px; box-shadow: 0 8px 24px rgba(17,21,29,0.06); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); max-width: 560px; transition: box-shadow 180ms var(--ease-standard), border-color 180ms var(--ease-standard); }
.prompt-input-demo:focus-within { border-color: color-mix(in srgb, var(--a-sky) 30%, rgba(255,255,255,0.62)); box-shadow: 0 0 0 4px color-mix(in srgb, var(--a-sky) 14%, transparent), 0 8px 24px rgba(17,21,29,0.06); }
.prompt-input-demo input { flex: 1; border: none; background: transparent; font-family: 'Geist', sans-serif; font-size: 14px; color: var(--text-primary); outline: none; }
.prompt-input-demo input::placeholder { color: var(--text-tertiary); }
.prompt-send { width: 36px; height: 36px; border-radius: 999px; background: var(--n-900); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 180ms var(--ease-standard), transform 180ms var(--ease-standard), box-shadow 180ms var(--ease-standard), opacity 180ms var(--ease-standard); flex-shrink: 0; color: white; font-size: 14px; }
.prompt-send:hover { background: var(--n-800); transform: scale(1.05); }

.token-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.token-table th { text-align: left; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-tertiary); padding: 8px 16px; border-bottom: 1px solid var(--n-150); }
.token-table td { padding: 12px 16px; border-bottom: 1px solid var(--n-100); color: var(--text-secondary); vertical-align: middle; }
.token-table tr:last-child td { border-bottom: none; }
.token-table td:first-child { font-family: 'Geist Mono', monospace; font-size: 12px; color: var(--text-primary); font-weight: 500; }
.token-table td code { font-family: 'Geist Mono', monospace; font-size: 11px; background: var(--n-100); border: 1px solid var(--n-150); border-radius: 6px; padding: 2px 7px; color: var(--n-700); }
.motion-bar { height: 4px; border-radius: 999px; background: var(--grad-mint-sky); display: inline-block; }

.semantic-row { display: flex; gap: 10px; flex-wrap: wrap; }
.semantic-pill { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.semantic-dot { width: 8px; height: 8px; border-radius: 50%; }

.principles-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.principle-card { padding: 24px; position: relative; overflow: hidden; }
.principle-card::before { content: ''; position: absolute; inset: 0; background: var(--grad-card-glow); pointer-events: none; opacity: 0.6; }
.principle-num { font-family: 'Instrument Serif', Georgia, serif; font-size: 40px; line-height: 1; letter-spacing: -0.04em; color: var(--n-300); margin-bottom: 12px; }
.principle-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; letter-spacing: -0.01em; }
.principle-body { font-size: 13px; color: var(--text-secondary); line-height: 1.65; }

.layout-diagram { display: grid; grid-template-columns: 56px 1fr 240px; gap: 8px; height: 320px; }
.layout-zone { border-radius: 16px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; border: 1.5px dashed var(--border-strong); background: rgba(255,255,255,0.4); transition: background 200ms; }
.layout-zone:hover { background: rgba(255,255,255,0.65); }
.layout-zone-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-tertiary); writing-mode: vertical-rl; transform: rotate(180deg); align-self: center; }
.layout-zone-label.h { writing-mode: horizontal-tb; transform: none; }
.layout-zone-mock { display: flex; flex-direction: column; gap: 8px; }
.layout-mock-bar { height: 6px; border-radius: 999px; background: var(--n-200); }
.layout-mock-card { height: 64px; border-radius: 12px; background: rgba(255,255,255,0.6); border: 1px solid var(--border-default); }

.inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
.inventory-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,0.6); border: 1px solid var(--border-default); font-size: 12px; color: var(--text-secondary); font-weight: 500; transition: background-color 160ms var(--ease-standard), box-shadow 160ms var(--ease-standard), color 160ms var(--ease-standard), transform 160ms var(--ease-standard); cursor: default; }
.inventory-item:hover { background: rgba(255,255,255,0.85); color: var(--text-primary); box-shadow: var(--shadow-xs); }
.inventory-num { font-family: 'Geist Mono', monospace; font-size: 10px; color: var(--text-tertiary); min-width: 20px; }

.card-tinted { padding: 20px; border-radius: 20px; border: 1px solid transparent; position: relative; overflow: hidden; transition: transform 220ms var(--ease-enter), box-shadow 220ms var(--ease-enter); }
.card-tinted:hover { transform: translateY(-2px); }
.card-tinted-mint  { background: rgba(184,255,216,0.28); border-color: rgba(184,255,216,0.55); box-shadow: 0 8px 28px rgba(184,255,216,0.25); }
.card-tinted-sky   { background: rgba(169,215,255,0.28); border-color: rgba(169,215,255,0.55); box-shadow: 0 8px 28px rgba(169,215,255,0.25); }
.card-tinted-lilac { background: rgba(216,199,255,0.28); border-color: rgba(216,199,255,0.55); box-shadow: 0 8px 28px rgba(216,199,255,0.25); }
.card-tinted-peach { background: rgba(255,210,184,0.28); border-color: rgba(255,210,184,0.55); box-shadow: 0 8px 28px rgba(255,210,184,0.25); }
.card-tinted-rose  { background: rgba(255,199,222,0.28); border-color: rgba(255,199,222,0.55); box-shadow: 0 8px 28px rgba(255,199,222,0.25); }
.card-tinted-sun   { background: rgba(255,240,166,0.28); border-color: rgba(255,240,166,0.55); box-shadow: 0 8px 28px rgba(255,240,166,0.25); }
.card-tinted-aqua  { background: rgba(151,240,255,0.28); border-color: rgba(151,240,255,0.55); box-shadow: 0 8px 28px rgba(151,240,255,0.25); }
.card-tinted-lime  { background: rgba(217,255,140,0.28); border-color: rgba(217,255,140,0.55); box-shadow: 0 8px 28px rgba(217,255,140,0.25); }
.card-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 10px; font-weight: 600; }

.divider { height: 1px; background: var(--border-strong); border: none; }
.label-row { display: flex; align-items: center; gap: 8px; }
.label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-tertiary); }
.code-pill { font-family: 'Geist Mono', monospace; font-size: 11px; background: var(--n-100); border: 1px solid var(--n-200); border-radius: 6px; padding: 2px 8px; color: var(--n-700); }
`;

/** Inject Google Fonts (Instrument Serif + Geist + Geist Mono) once per page. */
export function useGenieFonts() {
  useEffect(() => {
    const linkId = 'genie-ds-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap';
      document.head.appendChild(link);
    }
  }, []);
}

/** Wrapper that injects CSS + fonts and wraps children in the gds-root bg. */
export const GDS_WRAPPER_STYLE: React.CSSProperties = {
  padding: 40,
  background: 'var(--n-100)',
  minHeight: '100vh',
  position: 'relative',
};
