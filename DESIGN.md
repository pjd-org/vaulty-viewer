# Genie Design System

## Overview

Genie is a soft, card-first AI interface system built for clarity, speed, and low cognitive load.
It transforms AI interactions from chat logs into structured, actionable UI objects.

---

## Core Principles

### 1. Object-Based AI

AI outputs are not messages — they are:

- cards
- previews
- tasks
- assets
- actions

### 2. Low Cognitive Load

- Group related content
- Reduce text density
- Prioritize scannability over readability

### 3. Soft Depth

Depth comes from:

- blur
- translucency
- layering
- subtle shadows

Avoid:

- heavy borders
- high-contrast blocks
- visual noise

### 4. Calm Motion

- Smooth transitions
- No aggressive bounce
- Motion communicates state

---

## Visual Language

### Color System

#### Neutral

Used for structure and readability.

| Token         | Value     |
| ------------- | --------- |
| `neutral-0`   | `#FFFFFF` |
| `neutral-50`  | `#F8F8FA` |
| `neutral-100` | `#DFE3EA` |
| `neutral-300` | `#AAB4C3` |
| `neutral-500` | `#667085` |
| `neutral-700` | `#313846` |
| `neutral-800` | `#1C2230` |
| `neutral-900` | `#11151D` |

#### Accent (Pastel)

Used for glow, highlights, and emotional tone.

| Token          | Value     |
| -------------- | --------- |
| `accent-mint`  | `#B8FFD8` |
| `accent-lime`  | `#D9FF8C` |
| `accent-aqua`  | `#97F0FF` |
| `accent-sky`   | `#A9D7FF` |
| `accent-lilac` | `#D8C7FF` |
| `accent-peach` | `#FFD2B8` |
| `accent-rose`  | `#FFC7DE` |
| `accent-sun`   | `#FFF0A6` |

#### Semantic

| Token              | Value     |
| ------------------ | --------- |
| `semantic-info`    | `#7CCBFF` |
| `semantic-success` | `#8EE7A0` |
| `semantic-warning` | `#FFD66B` |
| `semantic-danger`  | `#FF8F8F` |

---

### Gradients

Used sparingly for atmosphere, not structure.

```css
/* Hero */
background: linear-gradient(
  135deg,
  rgba(217, 255, 140, 0.32),
  rgba(151, 240, 255, 0.24),
  rgba(255, 199, 222, 0.28)
);

/* Card Glow */
background: radial-gradient(
  circle at 20% 20%,
  rgba(184, 255, 216, 0.35),
  transparent 42%
);
```

---

### Surfaces

| Token              | Value                    |
| ------------------ | ------------------------ |
| `surface-base`     | `rgba(255,255,255,0.72)` |
| `surface-elevated` | `rgba(255,255,255,0.82)` |
| `surface-overlay`  | `rgba(255,255,255,0.58)` |
| `surface-dark`     | `rgba(22,28,38,0.82)`    |

### Borders

| Token            | Value                    |
| ---------------- | ------------------------ |
| `border-subtle`  | `rgba(255,255,255,0.36)` |
| `border-default` | `rgba(255,255,255,0.52)` |
| `border-strong`  | `rgba(198,205,216,0.7)`  |

---

## Typography

### Stack

- **Primary:** Inter / Geist / SF Pro
- **Alternative:** Manrope / Plus Jakarta Sans

### Scale

| Role  | Size / Line-height / Weight |
| ----- | --------------------------- |
| H1    | `32px / 40px / 600`         |
| H2    | `24px / 32px / 600`         |
| Title | `16px / 24px / 600`         |
| Body  | `14px / 22px / 400`         |
| Label | `13px / 18px / 500`         |
| Micro | `11px / 14px / 500`         |

### Rules

- No heavy bold (`800`+)
- No long paragraphs in cards
- Tight, structured content

---

## Spacing

```
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64
```

---

## Radius

```
10 / 14 / 18 / 24 / 28 / 32 / full
```

System preference: **large radius everywhere.**

---

## Shadows

```css
/* Soft */
box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);

/* Glass */
box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
```

---

## Blur

```
8px / 16px / 24px / 32px
```

---

## Layout System

### Desktop

```
[ Sidebar 72px ] [ Main — flexible ] [ Panel 320px ]
```

### Mobile

- Full-width cards
- Bottom composer
- Sheet-based navigation

---

## Core Components

### Primitives

- `GlassSurface`
- `Stack`
- `Inline`
- `DividerSoft`

### Inputs

- `PromptInput`
- `Composer`
- `SuggestionChip`

### Content

- `AssistantCard`
- `MediaPreviewCard`
- `FileCard`
- `TaskCard`
- `InsightCard`

### Navigation

- `SidebarRail`
- `Tabs`
- `FloatingDock`

### Feedback

- `SkeletonCard`
- `LoadingCard`
- `Toast`

---

## Component Specs

### GlassSurface

```
blur:    24px
border:  1px rgba(255,255,255,0.52)
radius:  24px
shadow:  soft glass
```

### AssistantCard

Structure:

1. header
2. content
3. actions
4. optional assets

States: `idle` · `loading` · `expanded` · `selected`

### PromptInput

```
height:     56px
radius:     full
background: white / soft
focus:      subtle glow ring
```

### SuggestionChip

```
height:  32–34px
radius:  full
style:   low contrast, inline grouping
```

---

## Motion

### Timing

| Token           | Value   |
| --------------- | ------- |
| `duration-fast` | `160ms` |
| `duration-base` | `220ms` |
| `duration-slow` | `320ms` |

### Easing

```css
--ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
--ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
--ease-exit: cubic-bezier(0.7, 0, 0.84, 0);
```

### Patterns

| Pattern | Behavior                    |
| ------- | --------------------------- |
| appear  | fade + slight upward motion |
| hover   | minimal lift                |
| expand  | spring                      |
| sheet   | slide + fade                |

---

## Interaction States

| State    | Style                             |
| -------- | --------------------------------- |
| Default  | soft, low contrast                |
| Hover    | slight elevation, brighter border |
| Active   | tighter shadow, subtle glow       |
| Disabled | reduced opacity, no shadow        |

---

## Accessibility

- Maintain readable contrast on all text
- Avoid text over gradients
- Minimum tap target: `40px`
- Visible focus states required
- Respect `prefers-reduced-motion`

---

## Design Patterns

### AI Workspace

- Central card feed
- Persistent input
- Side context panel

### Result Stack

- Main result
- Alternates
- Actions
- Related items

### Dashboard

- Cards for tasks, files, insights

---

## Do Not

- Overuse glass layers
- Over-saturate gradients
- Build chat-only UI
- Compress spacing
- Add unnecessary UI density

---

## System Identity

This is **not** a chat UI.

This is a:

- card-driven AI workspace
- soft productivity interface
- object-based interaction system

---

## Implementation Order

1. tokens
2. primitives
3. layout shell
4. cards
5. motion
6. polish
