# Responsive Design Guide

This guide documents how responsive design should work in `tracking-system-v2`.
Read this before creating or editing any responsive layout, navigation pattern,
page shell, card layout, table/list, dashboard, form, or narrow-width behavior.

The goal is not only "fit on a phone." The goal is to preserve useful
information, clear navigation, and comfortable interaction across phone, tablet,
and desktop sizes.

---

## Responsive Principles

- Design mobile-first, then enhance at tablet and desktop breakpoints.
- Support `320px` as the minimum viewport width.
- Never rely on page-level horizontal scrolling for normal app use.
- Use horizontal scrolling only for intentional local content, such as carousels,
  sprint-date strips, chip rows, or comparison sets.
- Keep primary actions reachable with one hand on phones.
- Keep touch targets at least `44px` high or wide for important controls.
- Prefer stacked information cards over compressed desktop rows on phones.
- Preserve information hierarchy: primary identity/title first, status/action
  second, metadata third.
- Use truncation only when the full value is not critical in that view.
- Use wrapping when the content is meaningful and should remain readable.
- Avoid hiding important data just to make a layout fit.

---

## Breakpoint Model

Use Tailwind's existing breakpoints unless the app has a specific reason to do
otherwise.

- `base` / phone: `320px` and up
  - Single-column content.
  - Compact topbar.
  - Bottom navigation or drawer navigation for app sections.
  - Full-width forms and search inputs.
  - Rows become stacked cards.

- `sm` / large phone: `640px` and up
  - Two-column grids may appear for small cards or form groups.
  - Card actions can sit beside headings when space allows.
  - Search and filters may share a row.

- `md` / tablet: `768px` and up
  - More dense grids are acceptable.
  - Secondary search controls can return to topbar or page header.
  - Bottom navigation can remain if the desktop sidebar is not yet appropriate.

- `lg` / desktop shell: `1024px` and up
  - Persistent sidebars are acceptable.
  - Multi-column dashboards are acceptable.
  - Desktop rows can include more metadata columns.

---

## Fellow Portal Pattern

The fellow portal is the reference implementation for responsive behavior.

### Phone

- Use a compact sticky topbar.
- Use bottom navigation for the core fellow destinations:
  - Home
  - Assignments
  - Learning
  - Team
  - Roster
- Put secondary destinations in a More menu:
  - Profile
  - Settings
  - Help and Support
  - Sign out
- Add bottom padding to page content so bottom navigation never covers content.
- Notification panels must fit within the viewport width.
- Page headers should stack: title and description first, actions/search below.
- Dense rows should become readable mobile cards:
  - Icon/title block
  - Status/date block
  - Action block

### Tablet

- Keep content full-width without a desktop sidebar until `lg`.
- Use wider page gutters than phone, but do not jump directly to desktop density.
- Allow two-column grids for cards, forms, and resource lists.
- Keep bottom navigation until the desktop sidebar appears.
- Avoid half-desktop layouts that create cramped columns.

### Desktop

- Use the persistent left sidebar at `lg+`.
- Restore desktop content padding and max-width containers.
- Use multi-column dashboard layouts where they improve scanning.
- Keep desktop and mobile navigation states consistent.

---

## Page-Level Rules

### Dashboard

- Phone: stack greeting, sprint switcher, current sprint card, assignments,
  team, learning blocks, stats, and activity.
- Tablet: use wider stacked sections or simple two-column groups.
- Desktop: use main-column plus side-column layout.
- Sprint date strips may scroll horizontally inside the card.

### Assignments

- Search is full-width on phone.
- Filters can wrap or scroll horizontally, but must not create page overflow.
- Queue rows should stack on phone and become rows again on wider screens.
- Submit/Done actions should be full-width on phone when placed at row bottom.

### Learning

- Link rows must fit at `320px`.
- Resource groups use one column on phone and two columns from `sm`.
- Progress pills should wrap or move below headings rather than compress titles.

### Team

- Member cards may remain in a horizontal carousel because team comparison is a
  local, intentional horizontal interaction.
- Sprint selector should be full-width on phone.
- Composition rule rows should stack detail text under the rule on phone.

### Roster

- Search and filter controls must fit on one row only if space allows.
- Roster rows show name/status and essential country/university on phone.
- Secondary chips such as archetype/team can move to wider breakpoints.
- Long universities and names should truncate inside their own container, not
  force page overflow.

### Profile and Settings

- Forms are single-column on phone.
- Contact rows and visibility controls stack on phone.
- Segmented/channel controls should become a grid or vertical stack on phone.
- Action rows should stack before they become cramped.

---

## Admin Portal Guidance

The admin portal is more data-dense than the fellow portal. When responsive work
is applied to admin pages, use the same minimum quality bar but choose patterns
that support operational work.

- Do not simply shrink desktop tables into unreadable mobile tables.
- Convert tables/lists into admin cards on phone:
  - Primary entity name
  - Status/progress
  - Key metadata
  - Primary action
- Use horizontal scrolling only for true tabular comparison where columns must
  remain aligned.
- Admin navigation should eventually use either:
  - a hamburger/sidebar drawer on phone, or
  - a bottom nav for the highest-frequency admin destinations plus a More menu.
- Admin dashboards should prioritize high-signal metrics first, then queues.
- Filters should collapse into a filter panel/sheet on phone when there are more
  than two controls.
- Bulk actions should remain reachable but not dominate narrow screens.
- Form dialogs must fit within the viewport and scroll internally when needed.
- Validate admin pages at the same target widths:
  - `320px`
  - `375px`
  - `768px`
  - `1024px`
  - desktop/default

---

## Implementation Checklist

Before finishing responsive work:

- Run the frontend build.
- Test every changed route at `320px`, `375px`, `768px`, `1024px`, and desktop.
- Confirm no document-level horizontal overflow.
- Confirm navigation is reachable and active state is clear.
- Confirm dropdowns, sheets, dialogs, notification panels, filters, and forms fit.
- Confirm bottom navigation or sticky bars do not cover content.
- Confirm long text wraps or truncates intentionally.
- Confirm desktop layout still looks consistent after mobile changes.

Browser check target:

```txt
Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
  <= document.documentElement.clientWidth + 1
```

Use screenshots or browser inspection when layout quality is visually important.

---

## Agent Rule

For any future task that mentions responsive design, mobile, tablet, resizing,
viewport, layout overflow, narrow width, phone UI, or adaptive navigation:

1. Read `RESPONSIVE.md`.
2. Read the affected layout/page files.
3. Apply the guide's patterns before inventing a new responsive behavior.
4. Verify at the standard viewport widths.
5. Explain any intentional exception in the final summary.
