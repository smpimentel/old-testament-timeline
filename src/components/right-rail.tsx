import { X, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { type TimelineEntity, timelineData, themeColors } from '../data/timeline-data';
import { useIsMobile, useModalA11y } from '../hooks';

interface RightRailProps {
  entity: TimelineEntity;
  onClose: () => void;
  onViewRelationship: (targetId: string) => void;
  pathMode: boolean;
}

export function RightRail({ entity, onClose, onViewRelationship, pathMode }: RightRailProps) {
  const isMobile = useIsMobile();
  const panelWidth = isMobile ? 'calc(100% - 16px)' : '360px';

  const { modalRef, initialFocusRef } = useModalA11y({
    isOpen: true,
    onClose,
    lockBodyScroll: isMobile,
  });

  const relatedEntities = entity.relationships
    ? timelineData.filter(e => entity.relationships?.includes(e.id))
    : [];

  // Format date
  const formatDate = (year: number, certainty: TimelineEntity['certainty']) => {
    return `${certainty === 'approximate' ? 'c. ' : ''}${year} BC`;
  };

  const dateLabel = entity.endYear
    ? `${formatDate(entity.startYear, entity.certainty)} - ${formatDate(entity.endYear, entity.certainty)}`
    : formatDate(entity.startYear, entity.certainty);

  const formatMetaLabel = (value: string | undefined) => {
    if (!value) return '';
    return value
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <>
      {/* Backdrop overlay - click to close */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0"
        style={{
          background: 'rgba(45, 36, 28, 0.15)',
          backdropFilter: 'blur(2px)',
          zIndex: 35,
        }}
        onClick={onClose}
      />
      
      {/* Right Rail Panel */}
      <motion.aside
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${entity.name} details`}
        initial={{ x: isMobile ? '100%' : 360 }}
        animate={{ x: 0 }}
        exit={{ x: isMobile ? '100%' : 360 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed right-0 top-0 bottom-0 overflow-y-auto"
        style={{
          width: panelWidth,
          background: 'var(--color-base-surface-elevated)',
          borderLeft: '1px solid var(--color-base-grid-major)',
          boxShadow: '-4px 0 24px rgba(45, 36, 28, 0.08)',
          zIndex: 40,
        }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3"
          style={{
            background: 'var(--color-base-surface-elevated)',
            borderBottom: '1px solid var(--color-base-grid-major)',
          }}
        >
          <div className="flex-1 min-w-0">
            <div 
              className="text-xs uppercase tracking-wide mb-1"
              style={{ 
                color: 'var(--color-base-text-secondary)',
                fontSize: 'var(--type-label-xs-size)',
                fontWeight: 600,
              }}
            >
              {entity.type === 'person' && formatMetaLabel(entity.role)}
              {entity.type === 'event' && formatMetaLabel(entity.category)}
              {entity.type === 'book' && formatMetaLabel(entity.genre)}
            </div>
            <h2 
              className="text-2xl font-display truncate"
              style={{
                color: 'var(--color-base-text-primary)',
                fontSize: 'var(--type-heading-2-size)',
                lineHeight: 'var(--type-heading-2-line)',
                fontWeight: 700,
              }}
            >
              {entity.name}
            </h2>
          </div>
          <button
            ref={initialFocusRef as React.RefObject<HTMLButtonElement>}
            onClick={onClose}
            className="flex-shrink-0 p-2 min-w-11 min-h-11 rounded-md transition-all hover:scale-110 flex items-center justify-center"
            style={{
              border: '2px solid var(--color-base-text-primary)',
              background: 'var(--color-base-surface-panel)',
            }}
            title="Close (ESC)"
            aria-label="Close panel"
          >
            <X size={18} style={{ color: 'var(--color-base-text-primary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Summary Section */}
          <section>
            <h3 
              className="text-sm font-semibold mb-2 uppercase tracking-wide"
              style={{ 
                color: 'var(--color-base-text-secondary)',
                fontSize: 'var(--type-label-xs-size)',
              }}
            >
              Summary
            </h3>
            <div className="space-y-3">
              <div 
                className="px-3 py-2 rounded-md font-mono"
                style={{
                  background: 'var(--color-base-parchment-deep)',
                  border: entity.certainty === 'approximate'
                    ? '1.5px dashed var(--color-base-text-secondary)'
                    : '1.5px solid var(--color-base-text-primary)',
                  fontSize: 'var(--type-body-sm-size)',
                }}
              >
                {dateLabel}
              </div>
              <p
                style={{
                  fontSize: 'var(--type-body-sm-size)',
                  lineHeight: 'var(--type-body-sm-line)',
                  color: 'var(--color-base-text-primary)',
                }}
              >
                {entity.description}
              </p>
              {entity.timelineStory === 'Active' && (
                <p
                  className="italic"
                  style={{
                    fontSize: 'var(--type-label-xs-size)',
                    color: 'var(--color-base-text-secondary)',
                  }}
                >
                  Dates reflect period of scriptural activity, not full lifespan.
                </p>
              )}
            </div>
          </section>

          {/* Themes Section */}
          {entity.themes && entity.themes.length > 0 && (
            <section>
              <h3 
                className="text-sm font-semibold mb-2 uppercase tracking-wide"
                style={{ 
                  color: 'var(--color-base-text-secondary)',
                  fontSize: 'var(--type-label-xs-size)',
                }}
              >
                Themes
              </h3>
              <div className="flex flex-wrap gap-2">
                {entity.themes.map(theme => (
                  <div
                    key={theme}
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      background: themeColors[theme],
                      border: '1.5px solid var(--color-base-text-primary)',
                      fontSize: 'var(--type-label-xs-size)',
                      fontWeight: 600,
                      color: 'var(--color-base-text-primary)',
                    }}
                  >
                    {theme}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Connections Section */}
          {relatedEntities.length > 0 && (
            <section>
              <h3 
                className="text-sm font-semibold mb-2 uppercase tracking-wide"
                style={{ 
                  color: 'var(--color-base-text-secondary)',
                  fontSize: 'var(--type-label-xs-size)',
                }}
              >
                Connections
              </h3>
              {!pathMode && (
                <div 
                  className="mb-3 px-3 py-2 rounded-md text-xs"
                  style={{
                    background: 'var(--color-base-parchment-deep)',
                    color: 'var(--color-base-text-secondary)',
                    fontSize: 'var(--type-label-xs-size)',
                    border: '1px solid var(--color-base-grid-major)',
                  }}
                >
                  Enable Path Mode to navigate connections
                </div>
              )}
              <div className="space-y-2">
                {relatedEntities.map(related => (
                  <button
                    key={related.id}
                    onClick={() => pathMode && onViewRelationship(related.id)}
                    disabled={!pathMode}
                    className="w-full px-3 py-3 min-h-11 rounded-md flex items-center justify-between transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      border: '1px solid var(--color-base-grid-major)',
                      background: 'var(--color-base-surface-panel)',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div 
                        className="font-semibold truncate"
                        style={{ 
                          fontSize: 'var(--type-body-sm-size)',
                          color: 'var(--color-base-text-primary)',
                        }}
                      >
                        {related.name}
                      </div>
                      <div 
                        className="text-xs truncate"
                        style={{ 
                          color: 'var(--color-base-text-secondary)',
                          fontSize: 'var(--type-label-xs-size)',
                        }}
                      >
                        {related.type === 'person' && formatMetaLabel(related.role)}
                        {related.type === 'event' && formatMetaLabel(related.category)}
                        {related.type === 'book' && formatMetaLabel(related.genre)}
                      </div>
                    </div>
                    {pathMode && (
                      <ArrowRight 
                        size={16} 
                        style={{ color: 'var(--color-base-text-secondary)' }} 
                      />
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Scripture Section */}
          {entity.scripture && (
            <section>
              <h3 
                className="text-sm font-semibold mb-2 uppercase tracking-wide flex items-center gap-2"
                style={{ 
                  color: 'var(--color-base-text-secondary)',
                  fontSize: 'var(--type-label-xs-size)',
                }}
              >
                <BookOpen size={14} />
                Scripture
              </h3>
              <div 
                className="px-3 py-2 rounded-md font-mono"
                style={{
                  background: 'var(--color-base-parchment-deep)',
                  border: '1px solid var(--color-base-grid-major)',
                  fontSize: 'var(--type-body-sm-size)',
                  color: 'var(--color-base-text-primary)',
                }}
              >
                {entity.scripture}
              </div>
            </section>
          )}

          {/* Notes Section */}
          {entity.notes && (
            <section>
              <h3
                className="text-sm font-semibold mb-2 uppercase tracking-wide"
                style={{
                  color: 'var(--color-base-text-secondary)',
                  fontSize: 'var(--type-label-xs-size)',
                }}
              >
                Notes
              </h3>
              <p
                className="leading-relaxed"
                style={{
                  fontSize: 'var(--type-body-sm-size)',
                  lineHeight: 'var(--type-body-sm-line)',
                  color: 'var(--color-base-text-primary)',
                }}
              >
                {entity.notes}
              </p>
            </section>
          )}

          {/* Source Section */}
          {entity.source && (
            <section>
              <details className="group">
                <summary
                  className="cursor-pointer text-sm font-semibold uppercase tracking-wide list-none flex items-center gap-1"
                  style={{
                    color: 'var(--color-base-text-secondary)',
                    fontSize: 'var(--type-label-xs-size)',
                  }}
                >
                  Source
                  <span className="text-xs ml-1 opacity-60">+</span>
                </summary>
                <p
                  className="mt-2"
                  style={{
                    fontSize: 'var(--type-body-sm-size)',
                    lineHeight: 'var(--type-body-sm-line)',
                    color: 'var(--color-base-text-primary)',
                  }}
                >
                  {entity.source}
                </p>
              </details>
            </section>
          )}
        </div>
      </motion.aside>
    </>
  );
}
