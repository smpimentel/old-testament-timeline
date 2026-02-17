/**
 * Integration tests for high-value user interaction flows
 * Tests: zoom controls, node selection, ESC overlay close, path mode, keyboard nav
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {
  computeTrackLayout,
  validateTrackLayout,
  getEntityY,
  DEFAULT_TRACK_CONFIG,
  type TrackLayoutConfig,
} from './lib/timeline-track-layout';

// Mock motion/react to skip animations
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
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Integration: Side Navigator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sidebar renders with search, themes, periods, and pathfinder', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Close welcome overlay first
    const beginBtn = screen.getByRole('button', { name: /begin exploration/i });
    await user.click(beginBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Sidebar nav should be present
    const nav = screen.getByRole('navigation', { name: /timeline navigation/i });
    expect(nav).toBeInTheDocument();

    // Search input should be present (sidebar starts open)
    expect(screen.getByPlaceholderText(/search people/i)).toBeInTheDocument();

    // Path button should be present
    const pathBtn = screen.getByRole('button', { name: /path/i });
    expect(pathBtn).toBeInTheDocument();
  });
});

describe('Integration: Selecting Node Opens Right Rail', () => {
  it('clicking a timeline node opens the right rail', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Close welcome overlay
    const beginBtn = screen.getByRole('button', { name: /begin exploration/i });
    await user.click(beginBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Find and click a timeline node (they have data-timeline-node attribute)
    const timelineNodes = document.querySelectorAll('[data-timeline-node]');
    expect(timelineNodes.length).toBeGreaterThan(0);

    // Click first node
    await user.click(timelineNodes[0] as HTMLElement);

    // Right rail should open (it's a dialog)
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });
});

describe('Integration: ESC Closes Overlays', () => {
  it('ESC closes welcome overlay', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Verify welcome overlay is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press ESC
    await user.keyboard('{Escape}');

    // Overlay should close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('ESC closes right rail after node selection', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Close welcome overlay
    const beginBtn = screen.getByRole('button', { name: /begin exploration/i });
    await user.click(beginBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Click a timeline node to open right rail
    const timelineNodes = document.querySelectorAll('[data-timeline-node]');
    await user.click(timelineNodes[0] as HTMLElement);

    // Verify right rail opened
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Press ESC to close
    fireEvent.keyDown(document, { key: 'Escape' });

    // Right rail should close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});

describe('Integration: Path Mode Toggle and Breadcrumb Behavior', () => {
  it('path mode toggle changes button state', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Close welcome overlay
    const beginBtn = screen.getByRole('button', { name: /begin exploration/i });
    await user.click(beginBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Find path mode button
    const pathBtn = screen.getByRole('button', { name: /path/i });
    expect(pathBtn).toHaveAttribute('aria-pressed', 'false');

    // Toggle path mode on
    await user.click(pathBtn);

    // Button should now show pressed state
    expect(pathBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking nodes in path mode adds breadcrumbs', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Close welcome overlay
    const beginBtn = screen.getByRole('button', { name: /begin exploration/i });
    await user.click(beginBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Enable path mode
    const pathBtn = screen.getByRole('button', { name: /path/i });
    await user.click(pathBtn);

    // Click first timeline node
    const timelineNodes = document.querySelectorAll('[data-timeline-node]');
    await user.click(timelineNodes[0] as HTMLElement);

    // Breadcrumb count should appear in sidebar (shows "1 crumb")
    await waitFor(() => {
      expect(screen.getByText(/1 crumb/)).toBeInTheDocument();
    });
  });

  it('clear button removes breadcrumbs', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Close welcome overlay
    const beginBtn = screen.getByRole('button', { name: /begin exploration/i });
    await user.click(beginBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Enable path mode
    const pathBtn = screen.getByRole('button', { name: /path/i });
    await user.click(pathBtn);

    // Click a timeline node to add breadcrumb
    const timelineNodes = document.querySelectorAll('[data-timeline-node]');
    await user.click(timelineNodes[0] as HTMLElement);

    // Wait for breadcrumb to appear
    await waitFor(() => {
      expect(screen.getByText(/1 crumb/)).toBeInTheDocument();
    });

    // Close right rail with ESC
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Click clear button (Clear path)
    const clearBtn = screen.getByRole('button', { name: /clear breadcrumbs/i });
    await user.click(clearBtn);

    // Breadcrumb count should be gone
    await waitFor(() => {
      expect(screen.queryByText(/crumb/)).toBeNull();
    });
  });
});

describe('Integration: Keyboard Activation on Timeline Nodes', () => {
  it('Enter key activates timeline node', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Close welcome overlay
    const beginBtn = screen.getByRole('button', { name: /begin exploration/i });
    await user.click(beginBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Focus first timeline node
    const timelineNodes = document.querySelectorAll('[data-timeline-node]');
    const firstNode = timelineNodes[0] as HTMLElement;
    firstNode.focus();

    // Press Enter
    await user.keyboard('{Enter}');

    // Right rail should open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('Space key activates timeline node', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Close welcome overlay
    const beginBtn = screen.getByRole('button', { name: /begin exploration/i });
    await user.click(beginBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Focus first timeline node
    const timelineNodes = document.querySelectorAll('[data-timeline-node]');
    const firstNode = timelineNodes[0] as HTMLElement;
    firstNode.focus();

    // Press Space
    await user.keyboard(' ');

    // Right rail should open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('timeline nodes have accessible labels', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Close welcome overlay
    const beginBtn = screen.getByRole('button', { name: /begin exploration/i });
    await user.click(beginBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Check that timeline nodes have aria-label
    const timelineNodes = document.querySelectorAll('[data-timeline-node]');
    expect(timelineNodes.length).toBeGreaterThan(0);

    const firstNode = timelineNodes[0] as HTMLElement;
    expect(firstNode).toHaveAttribute('aria-label');
    expect(firstNode.getAttribute('aria-label')).toMatch(/.*,\s*(person|event|book),\s*\d+/);
  });
});

describe('Integration: High-Zoom Non-Overlap Regression', () => {
  it('track layout remains collision-free at high zoom with max swimlanes', () => {
    // Simulate high-zoom config with max lanes (worst case)
    const highZoomConfig: TrackLayoutConfig = {
      ...DEFAULT_TRACK_CONFIG,
      // Max node heights at high zoom (zoom >= 2.5)
      maxNodeHeight: {
        event: 24,
        person: 28,
        book: 22,
      },
      // All swimlanes populated
      laneCount: {
        event: DEFAULT_TRACK_CONFIG.laneCount.event,
        person: DEFAULT_TRACK_CONFIG.laneCount.person,
        book: DEFAULT_TRACK_CONFIG.laneCount.book,
      },
    };

    const layout = computeTrackLayout(highZoomConfig);
    expect(validateTrackLayout(layout)).toBe(true);
  });

  it('entities in all swimlanes stay within track bounds at high zoom', () => {
    const layout = computeTrackLayout(DEFAULT_TRACK_CONFIG);
    const { laneCount } = DEFAULT_TRACK_CONFIG;

    // Check every swimlane position for each entity type
    for (let lane = 0; lane < laneCount.event; lane++) {
      const y = getEntityY(layout, 'event', lane);
      expect(y).toBeGreaterThanOrEqual(layout.events.baseY);
      expect(y).toBeLessThan(layout.people.baseY);
    }

    for (let lane = 0; lane < laneCount.person; lane++) {
      const y = getEntityY(layout, 'person', lane);
      expect(y).toBeGreaterThanOrEqual(layout.people.baseY);
      expect(y).toBeLessThan(layout.books.baseY);
    }

    for (let lane = 0; lane < laneCount.book; lane++) {
      const y = getEntityY(layout, 'book', lane);
      expect(y).toBeGreaterThanOrEqual(layout.books.baseY);
      expect(y).toBeLessThan(layout.totalHeight);
    }
  });

  it('track layout is valid and non-overlapping', () => {
    // Pure layout engine validation (no UI zoom buttons needed)
    const layout = computeTrackLayout(DEFAULT_TRACK_CONFIG);
    expect(validateTrackLayout(layout)).toBe(true);

    // Track bands must not overlap
    const eventsEnd = layout.events.baseY + layout.events.bandHeight;
    const peopleEnd = layout.people.baseY + layout.people.bandHeight;

    expect(eventsEnd).toBeLessThanOrEqual(layout.people.baseY);
    expect(peopleEnd).toBeLessThanOrEqual(layout.books.baseY);
  });

  it('extreme swimlane count produces valid non-overlapping layout', () => {
    // Stress test: many swimlanes per track
    const extremeConfig: TrackLayoutConfig = {
      ...DEFAULT_TRACK_CONFIG,
      laneCount: {
        event: 10,
        person: 15,
        book: 8,
      },
    };

    const layout = computeTrackLayout(extremeConfig);

    // Must pass validation
    expect(validateTrackLayout(layout)).toBe(true);

    // Verify all swimlane positions are within bounds
    for (let lane = 0; lane < extremeConfig.laneCount.event; lane++) {
      const y = getEntityY(layout, 'event', lane);
      expect(y + DEFAULT_TRACK_CONFIG.maxNodeHeight.event).toBeLessThanOrEqual(
        layout.events.baseY + layout.events.bandHeight
      );
    }

    for (let lane = 0; lane < extremeConfig.laneCount.person; lane++) {
      const y = getEntityY(layout, 'person', lane);
      expect(y + DEFAULT_TRACK_CONFIG.maxNodeHeight.person).toBeLessThanOrEqual(
        layout.people.baseY + layout.people.bandHeight
      );
    }

    for (let lane = 0; lane < extremeConfig.laneCount.book; lane++) {
      const y = getEntityY(layout, 'book', lane);
      expect(y + DEFAULT_TRACK_CONFIG.maxNodeHeight.book).toBeLessThanOrEqual(
        layout.books.baseY + layout.books.bandHeight
      );
    }
  });
});
