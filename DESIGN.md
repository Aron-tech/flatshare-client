---
name: Warm Organic Minimalist
colors:
  surface: '#fdf9f5'
  surface-dim: '#ddd9d6'
  surface-bright: '#fdf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ef'
  surface-container: '#f1edea'
  surface-container-high: '#ebe7e4'
  surface-container-highest: '#e6e2de'
  on-surface: '#1c1b1a'
  on-surface-variant: '#55433d'
  inverse-surface: '#31302e'
  inverse-on-surface: '#f4f0ec'
  outline: '#88726c'
  outline-variant: '#dbc1b9'
  surface-tint: '#98462b'
  primary: '#98462b'
  on-primary: '#ffffff'
  primary-container: '#d87758'
  on-primary-container: '#541400'
  inverse-primary: '#ffb59e'
  secondary: '#466551'
  on-secondary: '#ffffff'
  secondary-container: '#c5e8ce'
  on-secondary-container: '#4a6a55'
  tertiary: '#5f5f58'
  on-tertiary: '#ffffff'
  tertiary-container: '#94928a'
  on-tertiary-container: '#2b2b25'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#3a0b00'
  on-primary-fixed-variant: '#7a2f16'
  secondary-fixed: '#c8ebd1'
  secondary-fixed-dim: '#accfb6'
  on-secondary-fixed: '#022111'
  on-secondary-fixed-variant: '#2f4d3a'
  tertiary-fixed: '#e5e2d9'
  tertiary-fixed-dim: '#c9c6be'
  on-tertiary-fixed: '#1c1c17'
  on-tertiary-fixed-variant: '#484741'
  background: '#fdf9f5'
  on-background: '#1c1b1a'
  surface-variant: '#e6e2de'
typography:
  headline-xl:
    fontFamily: Newsreader
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-xl-mobile:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 30px
    fontWeight: '400'
    lineHeight: 38px
    letterSpacing: -0.005em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  headline-sm:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 2rem
  margin: 1.25rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies a peaceful, Japandi-inspired aesthetic tailored for collaborative domestic life. Shared living often introduces friction, anxiety, and micro-tensions around chores; the interface counters this by behaving like a calm, sunlit home rather than a sterile ticketing system or rigid project tracker.

The core emotional pillars are:
- **Tranquil Harmony:** Soft, low-stimulus tones that soothe chore-induced stress and encourage voluntary contribution over surveillance.
- **Organic Warmth:** Earthy ceramics, sun-bleached linen, and natural foliage cues instead of industrial coldness or high-gloss plastics.
- **Tactile Softness:** Generous negative space, gentle transitions, and comfortably rounded forms that feel human, unhurried, and welcoming.

The design movement combines modern Scandinavian ergonomics with Japanese minimalist warmth (Japandi). Visual hierarchy prioritizes spacious breathing room, subtle ambient light, and unadorned typography that feels editorial and timeless.

## Colors

The palette draws directly from natural clays, muted botanicals, and unbleached fiber. Contrast is handled intentionally without harsh pure-black or high-voltage saturations.

- **Background Canvas & Surface Tiers:**
  - Base canvas: `#FDFBF7` (sunlit off-white)
  - Card/Container default: `#FFFFFF` (creamy pure white surface lift)
  - Sub-surfaces & Insets: `#F5F2EB` (soft sand) and `#EFECE3` (warm linen)
- **Primary (Terracotta Accent):**
  - Base: `#D87758` (warm terracotta)
  - Deep / Pressed: `#C66A4D`
  - Soft Container / Tint: `#FAEDE8`
  - Used for interactive calls-to-action, active segment markers, unassigned tasks needing attention, and gentle priority badges.
- **Secondary (Sage Completion):**
  - Base: `#7C9D86` (calming sage green)
  - Deep / Active: `#5E826A`
  - Soft Container / Tint: `#EDF3EE`
  - Reserved strictly for positive feedback: completed chores, progress meter fills, streaks, and fair-share balance badges.
- **Text & Neutral Scale:**
  - Dominant Text: `#2C2B29` (deep warm charcoal; softer on the eyes than `#000000`)
  - Secondary Text: `#706E6B` (warm stone grey)
  - Tertiary / Placeholder Text: `#9E9B95` (soft pebble grey)
  - Subtle Borders / Hairlines: `#E8E4DA`

## Typography

The typographic pairing balances the literary, domestic elegance of **Newsreader** for headings with the ergonomic, humanist clarity of **Plus Jakarta Sans** for interfaces, body copy, and status metadata.

- **Newsreader** provides a gentle, editorial touch reminiscent of lifestyle journals and home guides. Its organic serifs instill a natural pause and deliberate pace.
- **Plus Jakarta Sans** grounds the application with geometric yet soft letterforms that excel at small sizes and high-density tracking. Generous tracking on small labels (`label-md`, `label-sm`) keeps metadata light and uncompressed.

## Layout & Spacing

The layout is built upon an unhurried, comfortable 8-point structural cadence wrapped in generous outer boundaries. 

- **Grid Strategy:**
  - Mobile (<640px): 4-column fluid layout with `1.25rem` (20px) margins and gutters. Single-column card stacking.
  - Tablet (640px–1024px): 8-column layout with `1.5rem` margins and `1.25rem` gutters. Chores list and roommate balances sit in complementary split panels.
  - Desktop (>1024px): 12-column layout capped at an optimal reading container width of `1120px` to maintain domestic intimacy. Gutters scale to `2rem`.
- **Rhythm & Whitespace:**
  - Components favor open air over compressed density. Cards use internal padding of `space-lg` (`1.5rem`) by default.
  - Generous vertical separation (`space-xl`) between household sections prevents the visual claustrophobia typical of enterprise task boards.

## Elevation & Depth

Depth in this system avoids dark synthetic drop shadows, harsh keylines, or clinical glossy glass. Instead, physical presence is conveyed through **sun-diffused ambient illumination** and layered warm surfaces:

- **Level 0 (Flat Canvas):** `#FDFBF7`. The raw surface upon which all elements rest.
- **Level 1 (Default Cards & Shelves):** Pure creamy white (`#FFFFFF`) with an ultra-soft, warm-tinted ambient halo:
  `box-shadow: 0 4px 20px -2px rgba(198, 106, 77, 0.04), 0 2px 6px -1px rgba(44, 43, 41, 0.03);`
- **Level 2 (Floating Action Buttons & Active Dialogs):**
  `box-shadow: 0 12px 32px -4px rgba(198, 106, 77, 0.08), 0 4px 12px -2px rgba(44, 43, 41, 0.04);`
- **Tonal Insets:** Depressed or secondary areas (e.g., chore logs, completed lists, unassigned buckets) do not use drop shadows; they use `#F5F2EB` or `#EFECE3` background fills with subtle hairline boundaries (`#E8E4DA`).

## Shapes

The visual language embraces organic warmth and tactile smoothness through a soft curvature philosophy:
- **Base Rounding (rounded-2xl):** 16px to 20px (`1rem` to `1.25rem`) applied to cards, bottom sheets, and major containers. This mirrors handcrafted ceramics and rounded wooden furniture.
- **Interactive Pill Forms:** Full circular radii (`9999px`) are reserved exclusively for buttons, selection chips, avatar badges, and filter pills, providing an inviting, touch-friendly affordance.
- **Input Fields & Inset Containers:** Standardized at `12px` to `14px` (`0.75rem` to `0.875rem`) for architectural balance against larger outer card curves.

## Components

### Buttons
- **Primary:** Filled in warm terracotta (`#D87758`), text in white (`#FFFFFF`), full pill radius (`9999px`), with `0.75rem` vertical and `1.5rem` horizontal padding. Hover shifts smoothly to `#C66A4D`.
- **Secondary / Soft:** Linen fill (`#F5F2EB`), text in deep charcoal (`#2C2B29`). Zero borders. Hover shifts to `#EFECE3`.
- **Ghost:** Transparent background with warm stone text (`#706E6B`), transitioning to `#FAEDE8` with terracotta text on hover.

### Cards
- Surface: `#FFFFFF` on `#FDFBF7` canvas.
- Radius: `1.25rem` (20px).
- Border: Optional soft boundary in `#E8E4DA` at 1px thickness; ambient warm shadow enabled.
- Header: Editorial Newsreader headline paired with an organic roommate presence indicator.

### Chips & Filter Pills
- Inactive: `#F5F2EB` background with `#706E6B` text, full pill roundedness.
- Active (Primary): `#FAEDE8` background with `#D87758` terracotta text and subtle active weight.
- Completed / State Filter: `#EDF3EE` background with `#5E826A` sage text.

### Checkboxes & Completion Affordances
- In place of harsh square checkboxes, chore completion uses a rounded organic target (`22px` diameter, `6px` radius or circular).
- Unchecked: 1.5px border in `#D4CFBF`, transparent fill.
- Checked: Soft spring bounce into `#7C9D86` (sage) fill with a crisp white checkmark icon, followed by a subtle strike and dimming of the task headline.

### Input Fields
- Fill: `#F5F2EB` background with zero hard borders in normal state.
- Focus: Subtle 1.5px transition to `#D87758` border and pure white `#FFFFFF` surface lift.
- Corner radius: `12px`.
- Padding: `0.75rem 1rem`.

### Housemate Fair-Share Balance Indicator (Custom Component)
- Horizontal capsule bar utilizing organic segment weights. Completed chore quotas render in soft sage (`#7C9D86`), pending duties in soft sand (`#EFECE3`), and overdue/nudge notices highlighted in terracotta (`#D87758`).
- Accompanying roommate avatars sit in round ceramic-style frames with subtle warm stone borders.