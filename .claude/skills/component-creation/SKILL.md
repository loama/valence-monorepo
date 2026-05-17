# Component Creation Skill

Guide for creating new components/sections via Claude Code or Cursor.

## 1. How to Describe What You Want

Be specific about:
- **What it does**: "A section showing 3 pricing tiers side by side"
- **Where it lives**: "On the homepage, below the testimonials section"
- **Content**: List the actual text, headings, CTAs you want
- **Behavior**: "The cards highlight on hover" or "clicking opens a modal"

Good prompt: "Create a 3-column feature grid for the homepage. Each column has an icon, a short heading, and 2 sentences of body text. Columns: Accuracy, Speed, Reliability. No background color, just a top border divider between columns."

## 2. File Structure You'll Get

```
src/modules/{page-name}/
  {component-name}.tsx       # The component
  {component-name}.test.tsx  # Tests (vitest + RTL)
```

Shared components go in `src/shared/components/{component-name}.tsx`.

## 3. Design System Rules (Applied Automatically)

**Typography**
- Body text: `font-sans` (NeueMontreal)
- Buttons/badges/eyebrows: Supply font via global CSS — no extra class needed
- Accent/display text: `font-dot-gothic` (use sparingly)

**Colors — always use semantic tokens, never raw Tailwind colors**
- Backgrounds: `bg-background`, `bg-background-2`, `bg-surface`, `bg-card`, `bg-muted`
- Text: `text-foreground`, `text-muted-foreground`, `text-brand`
- Borders: `border-border`
- Status: `text-success`, `text-error`, `text-warning`

**Shape**
- No rounded corners on cards, containers, or sections (`rounded-lg` etc. are banned)
- Only allowed on pills, avatars, circular icons, form inputs

**Spacing**
- Section padding: use `inner-padding` utility class
- Grid gaps and margins: follow existing section patterns

**Analytics**
- Every `<button>`, `<Link>`, `<a>` needs `data-track-event` from `WellKnownEvent` in `src/lib/analytics.ts`
- Add `data-track-label` and `data-track-section` for context

## 4. Where Files Should Go

| Component type | Location |
|---|---|
| Section for a specific page | `src/modules/{page-name}/` |
| Shared across 2+ pages | `src/shared/components/` |
| UI primitives (button, input, badge) | `src/components/ui/` via shadcn CLI |

## 5. Available Compound Components

Use these before building from scratch:

- **`SectionWrapper`** — consistent section padding and max-width
- **`SectionHeader`** — eyebrow + heading + optional subtext
- **`ContentCard`** — bordered card with sharp corners

Find them in `src/shared/components/` or `src/components/ui/`.

## 6. Example Prompts That Work Well

```
"Create a UseCases section for the homepage. Use the Stats.tsx grid
layout (full-bleed, bordered cells, [01][02][03] numbers).
Three use cases: Supply Chain, Finance, Energy. Each has a title,
2-sentence description, and a 'Learn more' link."
```

```
"Add a CTA banner component to src/shared/components/. Centered
heading, one primary button, one secondary button. Dark background
(bg-background-2). Reuse the button style from CTA.js."
```

```
"Build a team member card for the /company page. Photo, name, title,
LinkedIn link. Goes in src/modules/company/. Sharp corners, no shadow."
```

## 7. Pre-Commit Checklist

- [ ] No `rounded-lg` / `rounded-md` on cards or containers
- [ ] All colors use semantic tokens (`bg-surface` not `bg-white dark:bg-zinc-900`)
- [ ] All interactive elements have `data-track-event` attributes
- [ ] Component works in light and dark mode
- [ ] No inline styles — Tailwind classes only
- [ ] Test file created alongside the component
- [ ] `bun run dev` runs without errors
- [ ] Import uses `@/` alias (e.g. `import { cn } from "@/lib/utils"`)
