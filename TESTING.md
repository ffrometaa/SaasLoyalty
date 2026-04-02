# Testing Guide - LoyaltyOS

## Overview

LoyaltyOS uses a multi-layered testing strategy:

- **Unit Tests**: Vitest for component and utility tests
- **Integration Tests**: MSW (Mock Service Worker) for API mocking
- **E2E Tests**: Playwright for full browser testing

## Quick Start

```bash
# Install dependencies (already done)
pnpm install

# Run unit tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run all tests
pnpm test:all
```

## Test Structure

```
apps/dashboard/
├── tests/
│   ├── setup.ts              # Test setup & global mocks
│   ├── mocks/
│   │   ├── handlers.ts       # MSW API handlers
│   │   └── server.ts        # MSW server config
│   └── components/
│       ├── MetricCard.test.tsx
│       └── Sidebar.test.tsx
├── e2e/
│   ├── auth.setup.ts        # Authentication setup
│   ├── dashboard.spec.ts    # Dashboard E2E tests
│   └── members.spec.ts     # Members page E2E tests
└── playwright.config.ts    # Playwright configuration
```

## Writing Tests

### Component Tests (Vitest)

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    // assertions...
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('user can navigate to members', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=Members');
  await expect(page).toHaveURL(/\/members/);
});
```

## Mocking API Calls

Use MSW handlers in `tests/mocks/handlers.ts`:

```typescript
http.get('/api/members', () => {
  return HttpResponse.json({
    data: [{ id: '1', name: 'Test User' }],
  });
});
```

## Coverage Reports

After running `pnpm test:coverage`, view reports at:

- Terminal output (text)
- `coverage/index.html` (HTML)
- `coverage/lcov.info` (CI integration)

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    pnpm install --frozen-lockfile
    pnpm test
    pnpm test:e2e
```

## Troubleshooting

### Tests failing due to MSW
```bash
# Restart MSW handlers
pnpm test -- --run
```

### Playwright browser not installed
```bash
pnpm exec playwright install
```

### Timeout errors
Increase timeout in `vitest.config.ts`:
```typescript
test: {
  globals: true,
  hookTimeout: 10000,
  timeout: 10000,
}
```

## Best Practices

1. **Test isolation**: Each test should be independent
2. **Descriptive names**: `it('should display error when email is invalid')`
3. **One assertion focus**: Each test should verify one behavior
4. **Use userEvent**: Prefer userEvent over fireEvent for realistic interactions
5. **Mock external dependencies**: API calls, localStorage, etc.
