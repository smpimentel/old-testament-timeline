import { X } from 'lucide-react';
import { motion } from 'motion/react';
import type { Theme } from '../data/timeline-data';

interface ThemeCardProps {
  theme: Theme;
  sidebarWidth: number;
  onDismiss: () => void;
  onClick: () => void;
}

export function ThemeCard({ theme, sidebarWidth, onDismiss, onClick }: ThemeCardProps) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed z-30"
      style={{
        bottom: 16,
        left: sidebarWidth + 16,
        width: 300,
      }}
    >
      <div
        className="rounded-lg overflow-hidden cursor-pointer"
        style={{
          background: 'var(--color-base-surface-elevated)',
          border: '1px solid var(--color-base-grid-major)',
          borderLeft: `4px solid ${theme.color}`,
          boxShadow: '0 4px 16px rgba(45, 36, 28, 0.12)',
        }}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <h3
            style={{
              fontSize: 'var(--type-body-sm-size)',
              fontWeight: 700,
              color: 'var(--color-base-text-primary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {theme.id}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="flex items-center justify-center rounded-md transition-colors hover:bg-[var(--color-base-parchment-deep)]"
            style={{ width: 28, height: 28 }}
            aria-label="Dismiss theme card"
          >
            <X size={14} style={{ color: 'var(--color-base-text-secondary)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-3">
          {theme.theologicalDevelopment ? (
            <p
              style={{
                fontSize: 'var(--type-label-xs-size)',
                lineHeight: '1.4',
                color: 'var(--color-base-text-secondary)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {theme.theologicalDevelopment}
            </p>
          ) : (
            <p
              style={{
                fontSize: 'var(--type-label-xs-size)',
                lineHeight: '1.4',
                color: 'var(--color-base-text-secondary)',
              }}
            >
              {theme.description}
            </p>
          )}
          <span
            style={{
              fontSize: 'var(--type-label-xs-size)',
              color: theme.color,
              fontWeight: 600,
              marginTop: 6,
              display: 'inline-block',
            }}
          >
            View Details &rsaquo;
          </span>
        </div>
      </div>
    </motion.div>
  );
}
