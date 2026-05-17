# Contributing Skill

Quick reference for developers and AI agents contributing to the Nixtla web repo.

## Branch Naming

```
feat/short-description       # New features
fix/short-description        # Bug fixes
refactor/short-description   # Code refactoring
docs/short-description       # Documentation only
```

## Commit Messages

Follow conventional commits:

```
feat: add pricing section to homepage
fix: correct dark mode color on nav dropdown
refactor: extract SectionHeader into shared component
docs: update architecture.md with new module structure
chore: upgrade Next.js to 16.2
```

- Present tense, lowercase, no period
- Keep the subject line under 72 characters
- Body is optional but useful for "why" context

## Required Checks Before Opening a PR

Run all four in order:

```bash
bun run build          # Must succeed with zero errors
bunx vitest run        # All tests must pass
bun lint               # Zero ESLint errors
bun run lint:standards # Zero standards violations
```

Fix all failures before pushing.

## File Naming

- All files: `kebab-case.tsx` / `kebab-case.ts`
- Test files: `{component-name}.test.tsx` alongside the component
- No PascalCase filenames, no underscores in filenames

## Component Structure

**Default: Server Component** — no directive needed.

```tsx
// src/modules/homepage/hero-section.tsx
export function HeroSection() { ... }
```

**Client Component** — add directive only when the component uses:
- `useState`, `useEffect`, or other hooks
- Browser APIs (`window`, `document`)
- Event handlers that need client-side interactivity

```tsx
'use client'
export function InteractiveWidget() { ... }
```

Keep 'use client' boundaries as low as possible in the tree.

## Import Aliases

Always use `@/` for src imports:

```ts
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/section-header"
```

Never use deep relative paths like `../../../components/ui/button`.

## Testing

- Write tests for every new component and API route
- Test files live next to the source file
- Target: >90% coverage on new code
- Use vitest + React Testing Library for components
- Run a single test file during development: `bunx vitest run src/path/to/file.test.tsx`

## Design System Reference

Before writing any CSS or Tailwind classes, check:
- **Colors/Typography**: `src/app/globals.css`
- **Semantic tokens**: see "Theme Consistency Rules" in `CLAUDE.md`
- **Banned patterns**: no `rounded-lg/md` on cards, no raw color classes like `text-green-600`

Full design rules are in `CLAUDE.md` under "Styling Guidelines" and "Theme Consistency Rules".
