# AGENTS.md

Guidance for agents working in the Valence monorepo.

## Project Overview

Valence is a psychology platform with three deployable projects:

- `app`: Next.js, Capacitor, and shadcn product app. Deployed on Vercel under `/app`.
- `website`: Next.js and shadcn public website. Deployed on Vercel at `/`.
- `api`: Node.js and Express platform API. Deployed on Heroku.

Branches:

- `development`: development deployments.
- `main`: production deployments.

## Package Management

- Use Bun only. Do not use npm, yarn, or pnpm.
- Keep dependencies inside `app`, `website`, and `api`.
- Do not create or rely on root `node_modules`.
- Never commit any `node_modules` directory.
- Install all project dependencies with `bun run install:all`.

Common commands:

```bash
bun run install:all
bun run build
bun run dev:website
bun run dev:app
bun run dev:api
bun run react-doctor:website
bun run react-doctor:app
```

## Development Standards

- Think deeply before changing code, then execute completely.
- Prefer complete, working implementations over placeholders.
- Keep code simple, readable, typed, and maintainable.
- Use TypeScript strictness rather than suppressing errors.
- Do not add lint, type, or test ignores to hide failures.
- Server Components are the default in Next.js. Use Client Components only when hooks, event handlers, or browser APIs require them.
- Use `@/` imports inside each Next.js project.
- Use semantic HTML, accessible controls, and responsive layouts.
- Keep security in mind for auth, user data, API boundaries, and platform integrations.

## Frontend Guidance

- Use existing shadcn patterns and local UI primitives before creating new components.
- Prefer reusable components when a pattern appears more than once.
- Use `cn()` for conditional Tailwind class composition.
- Avoid inline styles unless there is a concrete technical reason.
- Check React Doctor when touching React or Next.js code.
- Use the repo-level skills in `skills/` as the canonical agent skills folder.
- When a task names a skill, or clearly matches one, read `skills/<skill-name>/SKILL.md` before acting.
- `.claude/skills` is only a compatibility link for Claude Code. Do not treat it as the source of truth.
- Follow these repo skills when they apply:
  - `frontend-design`
  - `component-creation`
  - `react-doctor`
  - `vercel-react-best-practices`
  - `vercel-composition-patterns`
  - `web-design-guidelines`
  - `supertruth`

## Testing And Verification

- Run the smallest useful verification first, then broaden when risk requires it.
- Run builds before pushing changes.
- For React changes, run React Doctor for the affected project.
- For API changes, verify `bun run --cwd api build` and the relevant endpoint behavior.
- Do not write tests that only validate mocks. Tests should prove real behavior.

## Git Workflow

- Use Git flow style branches from `development` by default.
- Branch names must be lowercase kebab-case with a type prefix:
  - `feat/short-description`
  - `fix/short-description`
  - `docs/short-description`
  - `chore/short-description`
  - `refactor/short-description`
- Commit messages must use Conventional Commits:
  - `feat(app): add onboarding shell`
  - `fix(api): validate health response`
  - `docs: add deployment notes`
- Keep commit subjects imperative, lowercase after the colon, and under 72 characters.
- Split unrelated changes into separate commits.
- Do not add `Co-Authored-By`, AI attribution, or generated-by text.

## Pull Requests

- Open PRs against `development` unless explicitly told otherwise.
- Use `gh pr create --base development --assignee loama`.
- PR titles should match Conventional Commit style.
- PR bodies should explain what changed, why it changed, how it was verified, and any deployment notes.
- For visual changes, include screenshots or clear visual verification notes.
- Do not call a PR ready until CI passes, review threads are resolved, and expected automation has finished.

## Accuracy And Research

- Use `supertruth` for exact numbers, billing data, usage metrics, API error rates, or any question where wrong data would matter.
- Prefer primary sources and direct queries over memory.
- If something is blocked or uncertain, say exactly what is known, what was tried, and what decision is needed.
