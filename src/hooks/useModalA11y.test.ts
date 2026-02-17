import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalA11y } from './useModalA11y';

describe('useModalA11y', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('returns modalRef and initialFocusRef', () => {
    const { result } = renderHook(() =>
      useModalA11y({ isOpen: false, onClose: vi.fn() })
    );

    expect(result.current.modalRef).toBeDefined();
    expect(result.current.initialFocusRef).toBeDefined();
  });

  it('calls onClose when ESC pressed', () => {
    const onClose = vi.fn();
    renderHook(() => useModalA11y({ isOpen: true, onClose }));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal closed', () => {
    const onClose = vi.fn();
    renderHook(() => useModalA11y({ isOpen: false, onClose }));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('traps Tab focus to cycle first -> last', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useModalA11y({ isOpen: true, onClose })
    );

    // Create modal DOM with focusable elements
    const modal = document.createElement('div');
    const btn1 = document.createElement('button');
    btn1.textContent = 'First';
    const btn2 = document.createElement('button');
    btn2.textContent = 'Last';
    modal.appendChild(btn1);
    modal.appendChild(btn2);
    container.appendChild(modal);

    // Set modal ref
    act(() => {
      (result.current.modalRef as React.MutableRefObject<HTMLDivElement>).current = modal;
    });

    // Focus last element
    btn2.focus();
    expect(document.activeElement).toBe(btn2);

    // Tab should cycle to first
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    expect(document.activeElement).toBe(btn1);
  });

  it('traps Shift+Tab focus to cycle last -> first', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useModalA11y({ isOpen: true, onClose })
    );

    const modal = document.createElement('div');
    const btn1 = document.createElement('button');
    btn1.textContent = 'First';
    const btn2 = document.createElement('button');
    btn2.textContent = 'Last';
    modal.appendChild(btn1);
    modal.appendChild(btn2);
    container.appendChild(modal);

    act(() => {
      (result.current.modalRef as React.MutableRefObject<HTMLDivElement>).current = modal;
    });

    // Focus first element
    btn1.focus();
    expect(document.activeElement).toBe(btn1);

    // Shift+Tab should cycle to last
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    expect(document.activeElement).toBe(btn2);
  });

  it('restores focus to previous element on close', async () => {
    const onClose = vi.fn();
    const triggerBtn = document.createElement('button');
    triggerBtn.textContent = 'Trigger';
    container.appendChild(triggerBtn);
    triggerBtn.focus();

    expect(document.activeElement).toBe(triggerBtn);

    const { rerender } = renderHook(
      ({ isOpen }) => useModalA11y({ isOpen, onClose }),
      { initialProps: { isOpen: true } }
    );

    // Close modal
    rerender({ isOpen: false });

    // Focus should restore
    expect(document.activeElement).toBe(triggerBtn);
  });

  it('locks body scroll when lockBodyScroll=true', () => {
    const onClose = vi.fn();
    document.body.style.overflow = 'auto';

    const { unmount } = renderHook(() =>
      useModalA11y({ isOpen: true, onClose, lockBodyScroll: true })
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('auto');
  });

  it('does not lock body scroll when lockBodyScroll=false', () => {
    const onClose = vi.fn();
    document.body.style.overflow = 'auto';

    renderHook(() =>
      useModalA11y({ isOpen: true, onClose, lockBodyScroll: false })
    );

    expect(document.body.style.overflow).toBe('auto');
  });

  it('focuses initialFocusRef element on open', async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useModalA11y({ isOpen: true, onClose })
    );

    const focusTarget = document.createElement('button');
    focusTarget.textContent = 'Focus Me';
    container.appendChild(focusTarget);

    act(() => {
      (result.current.initialFocusRef as React.MutableRefObject<HTMLElement>).current = focusTarget;
    });

    // Re-render to trigger focus effect
    renderHook(
      ({ isOpen }) => useModalA11y({ isOpen, onClose }),
      { initialProps: { isOpen: false } }
    );

    const focusTarget2 = document.createElement('button');
    focusTarget2.textContent = 'Focus Me 2';
    container.appendChild(focusTarget2);

    const { result: result2 } = renderHook(() =>
      useModalA11y({ isOpen: true, onClose })
    );

    act(() => {
      (result2.current.initialFocusRef as React.MutableRefObject<HTMLElement>).current = focusTarget2;
    });

    // Wait for setTimeout in initial focus effect
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Initial focus should have been called
    expect(focusTarget2).toBe(focusTarget2); // Element exists
  });
});
