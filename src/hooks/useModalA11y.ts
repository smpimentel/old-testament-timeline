/**
 * useModalA11y - Reusable modal accessibility hook
 *
 * Provides standard modal a11y behavior:
 * - Focus trap: cycles focus within modal container
 * - ESC key: closes modal via callback
 * - Initial focus: focuses specified element on mount
 * - Restore focus: returns focus to trigger element on close
 * - Body scroll lock: optionally prevents background scroll
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const { modalRef, initialFocusRef } = useModalA11y({
 *     isOpen,
 *     onClose,
 *     lockBodyScroll: true,
 *   });
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={modalRef} role="dialog" aria-modal="true">
 *       <button ref={initialFocusRef}>Close</button>
 *       <input type="text" />
 *     </div>
 *   );
 * }
 * ```
 */

import { useRef, useEffect, useCallback } from 'react';

export interface UseModalA11yOptions {
  /** Whether modal is currently open */
  isOpen: boolean;
  /** Callback when ESC pressed or focus escapes */
  onClose: () => void;
  /** Lock body scroll when open (default: false) */
  lockBodyScroll?: boolean;
}

export interface UseModalA11yReturn {
  /** Ref for modal container - required for focus trap */
  modalRef: React.RefObject<HTMLDivElement | null>;
  /** Ref for initial focus target element */
  initialFocusRef: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useModalA11y({
  isOpen,
  onClose,
  lockBodyScroll = false,
}: UseModalA11yOptions): UseModalA11yReturn {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const initialFocusRef = useRef<HTMLElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store active element when opening
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Initial focus
  useEffect(() => {
    if (!isOpen) return;

    // Delay to ensure modal DOM is rendered
    const timeoutId = setTimeout(() => {
      if (initialFocusRef.current) {
        initialFocusRef.current.focus();
      } else if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        firstFocusable?.focus();
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  // Restore focus on close
  useEffect(() => {
    if (isOpen) return;

    if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen]);

  // Focus trap - cycle focus within modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      // ESC to close - works even without modalRef
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Tab trap - requires modalRef
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab from first -> last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab from last -> first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [isOpen, onClose]
  );

  // Attach keydown listener
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Body scroll lock
  useEffect(() => {
    if (!lockBodyScroll || !isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, lockBodyScroll]);

  return {
    modalRef,
    initialFocusRef,
  };
}
