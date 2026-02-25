import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RightRail } from './right-rail';
import type { TimelineEntity } from '../data/timeline-data';

// Mock motion/react to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    aside: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLDivElement> }) => (
      <aside {...props}>{children}</aside>
    ),
  },
}));

// Mock useIsMobile
vi.mock('../hooks', async () => {
  const actual = await vi.importActual('../hooks');
  return {
    ...actual,
    useIsMobile: () => false,
  };
});

const mockEntity: TimelineEntity = {
  id: 'test-entity',
  name: 'Test Entity',
  type: 'person',
  role: 'prophet',
  startYear: 1000,
  certainty: 'exact',
  priority: 2,
  description: 'Test description',
  themes: ['Covenant'],
  relationships: [],
};

describe('RightRail a11y', () => {
  let onClose: ReturnType<typeof vi.fn<() => void>>;
  let onViewRelationship: ReturnType<typeof vi.fn<(targetId: string) => void>>;
  let onViewEntity: ReturnType<typeof vi.fn<(entity: TimelineEntity) => void>>;
  let onViewTheme: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn<() => void>();
    onViewRelationship = vi.fn<(targetId: string) => void>();
    onViewEntity = vi.fn<(entity: TimelineEntity) => void>();
    onViewTheme = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    render(
      <RightRail
        content={{ kind: 'entity', entity: mockEntity }}
        onClose={onClose}
        onViewRelationship={onViewRelationship}
        onViewEntity={onViewEntity}
        onViewTheme={onViewTheme}
        pathMode={false}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has accessible label with entity name', () => {
    render(
      <RightRail
        content={{ kind: 'entity', entity: mockEntity }}
        onClose={onClose}
        onViewRelationship={onViewRelationship}
        onViewEntity={onViewEntity}
        onViewTheme={onViewTheme}
        pathMode={false}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Test Entity details');
  });

  it('closes on ESC key', async () => {
    render(
      <RightRail
        content={{ kind: 'entity', entity: mockEntity }}
        onClose={onClose}
        onViewRelationship={onViewRelationship}
        onViewEntity={onViewEntity}
        onViewTheme={onViewTheme}
        pathMode={false}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('focuses close button on open', async () => {
    render(
      <RightRail
        content={{ kind: 'entity', entity: mockEntity }}
        onClose={onClose}
        onViewRelationship={onViewRelationship}
        onViewEntity={onViewEntity}
        onViewTheme={onViewTheme}
        pathMode={false}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close panel/i });

    await waitFor(() => {
      expect(document.activeElement).toBe(closeBtn);
    });
  });

  it('traps focus within dialog', async () => {
    const user = userEvent.setup();

    render(
      <RightRail
        content={{ kind: 'entity', entity: mockEntity }}
        onClose={onClose}
        onViewRelationship={onViewRelationship}
        onViewEntity={onViewEntity}
        onViewTheme={onViewTheme}
        pathMode={false}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close panel/i });

    // Wait for initial focus
    await waitFor(() => {
      expect(document.activeElement).toBe(closeBtn);
    });

    // Tab through all focusable elements - should cycle back
    const focusableElements = screen.getByRole('dialog').querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Tab to last focusable element
    for (let i = 0; i < focusableElements.length - 1; i++) {
      await user.tab();
    }

    // Next tab should cycle to first focusable
    await user.tab();

    // Should be back at first focusable (close button)
    expect(document.activeElement).toBe(closeBtn);
  });

  it('closes when backdrop clicked', async () => {
    const user = userEvent.setup();

    render(
      <RightRail
        content={{ kind: 'entity', entity: mockEntity }}
        onClose={onClose}
        onViewRelationship={onViewRelationship}
        onViewEntity={onViewEntity}
        onViewTheme={onViewTheme}
        pathMode={false}
      />
    );

    // Find backdrop (div with click handler before dialog)
    const backdrop = document.querySelector('[style*="blur"]');
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('close button has accessible label', () => {
    render(
      <RightRail
        content={{ kind: 'entity', entity: mockEntity }}
        onClose={onClose}
        onViewRelationship={onViewRelationship}
        onViewEntity={onViewEntity}
        onViewTheme={onViewTheme}
        pathMode={false}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close panel/i });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveAttribute('title', 'Close (ESC)');
  });
});
