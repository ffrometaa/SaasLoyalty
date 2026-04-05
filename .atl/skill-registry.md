# Skill Registry - LoyaltyOS

This registry maps skills and project conventions to code and task contexts.

## Skill Triggers

| Context | Skill | Trigger |
|---------|-------|---------|
| Go tests, Bubbletea TUI testing | go-testing | file: `**/*.go`, task: `test` |
| Creating new AI skills | skill-creator | task: `create-skill` |
| GitHub PR creation | branch-pr | task: `pr-create` |
| GitHub Issue creation | issue-creation | task: `issue-create` |
| Adversarial review | judgment-day | task: `review-adversarial` |

## Project Standards

### TypeScript & Next.js
- **Pattern**: Next.js 14 App Router, TypeScript
- **Style**: TailWind CSS, Lucide Icons
- **Conventions**: Standard Next.js file structure (app/, components/, lib/, hooks/)

### Testing (Vitest & Playwright)
- **Unit/Integration**: Vitest with `@testing-library/react` and MSW.
- **E2E**: Playwright.
- **Strict TDD Mode**: Enabled. ALL implementation tasks MUST include a corresponding test.

### Monorepo (pnpm & Turbo)
- **Manager**: pnpm workspaces
- **Orchestrator**: Turborepo (`turbo run build`, `turbo run lint`, etc.)
- **Packages**: `@loyalty-os/db`, `@loyalty-os/lib`, `@loyalty-os/ui`, `@loyalty-os/email`, `@loyalty-os/config`

## Compact Rules

### Testing
- Always verify changes with Vitest or Playwright.
- Use MSW handlers for API mocking.
- Prefer `userEvent` over `fireEvent`.

### Code Style
- Run `pnpm format` before finishing.
- Ensure type safety with `pnpm type-check`.
- Follow Next.js best practices for server/client components.
