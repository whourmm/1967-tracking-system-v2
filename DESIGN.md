---
name: SEA Bridge Fellowship Tracker
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#5c403c'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#916f6b'
  outline-variant: '#e6bdb8'
  surface-tint: '#bf0715'
  primary: '#b70011'
  on-primary: '#ffffff'
  primary-container: '#dc2626'
  on-primary-container: '#fff6f5'
  inverse-primary: '#ffb4ab'
  secondary: '#b02d29'
  on-secondary: '#ffffff'
  secondary-container: '#ff665c'
  on-secondary-container: '#690007'
  tertiary: '#b21320'
  on-tertiary: '#ffffff'
  tertiary-container: '#d63135'
  on-tertiary-container: '#fff6f5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ac'
  on-secondary-fixed: '#410002'
  on-secondary-fixed-variant: '#8e1214'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
  soft-pink: '#FCA5A5'
  pale-pink: '#FEE2E2'
  slate-text: '#6B7280'
  border-grey: '#E5E7EB'
  surface-bg: '#F9FAFB'
  status-success: '#10B981'
  status-warning: '#F59E0B'
  brand-pure-red: '#E30613'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is engineered for the **SEA Bridge Institute of Entrepreneurship**, focusing on the "ASEAN 1967 Fellowship." The brand personality is **authoritative, institutional, yet catalytic**. It balances the gravity of regional diplomatic history with the high-velocity energy of modern entrepreneurship.

The chosen design style is **Corporate / Modern** with a lean toward **Data-Dense Minimalism**. The interface prioritizes clarity, utilizing a strict grid and high-contrast typography to ensure that complex cohort data remains digestible. The visual language is "High-Performance Institutional"—clean white surfaces, precise borders, and a dominant use of red to signal action and urgency.

## Colors

This design system utilizes a **Red-Dominant Palette** to reflect the ASEAN heritage and the "Bold" aspect of the brand tagline. 

- **Primary Red (#DC2626):** Reserved for core brand identifiers, primary action buttons, and active navigation states.
- **Deep & Mid Reds:** Used for hierarchical emphasis and interactive states (hover/press) to provide tactile feedback without losing the brand identity.
- **Supportive Pinks:** Utilized for data visualization (heatmaps) and low-contrast UI backgrounds to prevent "red fatigue."
- **Neutrals:** Charcoal (#111827) provides the grounding for high-readability text, while Surface (#F9FAFB) keeps the interface feeling light and contemporary.
- **Semantic Colors:** Green and Amber are strictly reserved for status indicators (Active vs. Pending) to ensure immediate data comprehension.

## Typography

The typography strategy is built on **Hanken Grotesk** for headlines to provide a sharp, contemporary startup feel, and **Inter** for body text to maintain maximum legibility in data-heavy views. 

- **Hierarchy:** Use bold weights for headlines to create a strong vertical rhythm.
- **Data Labels:** **JetBrains Mono** is introduced for labels and status pills to emphasize the "tracker" and "data-driven" nature of the product, providing a subtle technical aesthetic.
- **Contrast:** Always use Charcoal (#111827) for primary headings and Slate (#6B7280) for supporting body text or metadata.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The main content container is capped at 1280px for desktop readability, centered on the screen.

- **Grid:** A 12-column grid system is used for dashboard layouts.
- **Spacing Scale:** Based on a 4px baseline. Use 16px (md) for standard component padding and 24px (lg) for gutter spacing between cards.
- **Mobile Adaptation:** On mobile (below 768px), margins reduce to 16px and the 12-column grid collapses into a single-column stack. Typography scales down specifically for Large Headlines to ensure no text clipping.

## Elevation & Depth

This design system eschews heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

- **Surfaces:** Use White (#FFFFFF) for primary cards against a Surface (#F9FAFB) background to create natural separation without the need for elevation.
- **Borders:** A 1px solid border using Border-Grey (#E5E7EB) is the primary method for defining element boundaries and grouping information.
- **Interaction Depth:** On hover, cards may transition to a subtle 2px blur shadow with 5% opacity of the Charcoal color to provide a "lift" effect, but the default state remains flat and architectural.

## Shapes

The shape language is **Soft and Professional**. A consistent 4px (0.25rem) radius is applied to standard components (inputs, buttons, cards) to bridge the gap between the sharpness of "data" and the approachability of a "fellowship."

- **Cards:** Use `rounded-lg` (8px) to define major layout sections.
- **Buttons/Inputs:** Use base `rounded` (4px) for a crisp, functional look.
- **Pills:** Status indicators use the "full" roundedness to distinguish them as non-interactive status chips.

## Components

### Buttons
- **Primary:** Brand Red (#DC2626) background, White text. High-contrast, no shadow.
- **Secondary:** White background, 1px Border-Grey outline, Charcoal text.
- **Hover States:** Primary buttons shift to Mid Red (#EF4444).

### Status Pills
- **Active:** Green (#10B981) text on a 10% opacity Green background.
- **Pending:** Amber (#F59E0B) text on a 10% opacity Amber background.
- **Typography:** Use `label-sm` (JetBrains Mono) in all-caps for a systematic feel.

### Cards
- **Structure:** White background, 1px Border-Grey outline, 8px corner radius. 
- **Header:** Use a subtle bottom border to separate the title from the card body.

### Input Fields
- **Default:** White background, 1px Border-Grey, Inter regular text.
- **Focus:** 1px Brand Red (#DC2626) border with a soft 2px red glow (5% opacity).

### Progress Trackers
- Use Pale Pink (#FEE2E2) for the empty track and Brand Red (#DC2626) for the fill to maintain the red-dominant theme.