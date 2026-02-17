import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeDefined();
  });

  it('shows welcome overlay initially', () => {
    render(<App />);
    expect(screen.getByText(/Old Testament Timeline/i)).toBeDefined();
  });
});

describe('WelcomeOverlay a11y', () => {
  it('focuses Begin Exploration button on open', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /begin exploration/i })).toHaveFocus();
    });
  });

  it('closes on ESC key', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Verify overlay is open
    expect(screen.getByRole('dialog')).toBeDefined();

    // Press ESC
    await user.keyboard('{Escape}');

    // Overlay should be closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('traps focus within modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for initial focus
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /begin exploration/i })).toHaveFocus();
    });

    const closeBtn = screen.getByRole('button', { name: /close welcome overlay/i });
    const beginBtn = screen.getByRole('button', { name: /begin exploration/i });

    // Tab from Begin button (last) should wrap to Close button (first)
    await user.tab();
    expect(closeBtn).toHaveFocus();

    // Shift+Tab from Close (first) should wrap to Begin (last)
    await user.tab({ shift: true });
    expect(beginBtn).toHaveFocus();
  });

  it('closes when Begin Exploration clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    const beginBtn = screen.getByRole('button', { name: /begin exploration/i });
    await user.click(beginBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
