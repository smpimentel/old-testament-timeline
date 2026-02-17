import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { type TimelineEntity } from '../data/timeline-data';

interface HoverTooltipProps {
  entity: TimelineEntity;
  x: number;
  y: number;
}

export function HoverTooltip({ entity, x, y }: HoverTooltipProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ x, y });

  // Delay showing tooltip by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 300);
    return () => {
      clearTimeout(timer);
      setShow(false);
    };
  }, [entity]);

  // Track mouse position globally for smooth following
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const formatDate = (year: number, certainty: TimelineEntity['certainty']) => {
    return `${certainty === 'approximate' ? 'c. ' : ''}${Math.abs(year)} BC`;
  };

  const formatDateRange = (startYear: number, endYear: number | undefined, certainty: TimelineEntity['certainty']) => {
    if (!endYear) return formatDate(startYear, certainty);
    return `${formatDate(startYear, certainty)} - ${formatDate(endYear, certainty)}`;
  };

  // Get role/type label
  let roleOrType = '';
  if (entity.type === 'person' && entity.role) {
    roleOrType = entity.role.charAt(0).toUpperCase() + entity.role.slice(1);
  } else if (entity.type === 'event' && entity.category) {
    roleOrType = entity.category.charAt(0).toUpperCase() + entity.category.slice(1);
  } else if (entity.type === 'book') {
    roleOrType = 'Book';
  }

  const dateStr = formatDateRange(entity.startYear, entity.endYear, entity.certainty);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x + 16,
        top: position.y + 16,
        maxWidth: '320px',
      }}
    >
      <div
        className="rounded-lg p-4 shadow-lg"
        style={{
          backgroundColor: 'var(--color-base-surface-elevated)',
          border: '1px solid var(--color-base-grid-major)',
        }}
      >
        {/* Title and Role/Type Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--color-base-text-primary)',
            }}
          >
            {entity.name}
          </h4>
          {roleOrType && (
            <span
              className="text-xs px-2 py-1 rounded whitespace-nowrap"
              style={{
                backgroundColor: 'var(--color-base-parchment)',
                color: 'var(--color-base-text-secondary)',
                fontFamily: 'Source Sans 3, sans-serif',
                fontWeight: 600,
              }}
            >
              {roleOrType}
            </span>
          )}
        </div>

        {/* Date */}
        <div
          className="text-xs mb-2"
          style={{
            color: 'var(--color-base-text-secondary)',
            fontFamily: 'IBM Plex Mono, monospace',
            fontWeight: 600,
          }}
        >
          {dateStr}
        </div>

        {/* Description */}
        <p
          style={{
            fontFamily: 'Source Sans 3, sans-serif',
            fontSize: '14px',
            color: 'var(--color-base-text-primary)',
            lineHeight: '1.5',
          }}
        >
          {entity.description}
        </p>

        {/* Theme Tags */}
        {entity.themes && entity.themes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {entity.themes.map((theme) => (
              <span
                key={theme}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  backgroundColor: 'rgba(var(--color-theme-covenant-rgb), 0.2)',
                  color: 'var(--color-base-text-primary)',
                  fontFamily: 'Source Sans 3, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: '1px solid rgba(var(--color-theme-covenant-rgb), 0.3)',
                }}
              >
                {theme}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}