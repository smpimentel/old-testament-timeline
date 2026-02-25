import { X, ArrowRight, BookOpen, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { type TimelineEntity, type Theme, type ThemeTag, timelineData, themeColors, themeById, themeOverlayByTheme } from '../data/timeline-data';
import { useIsMobile, useModalA11y } from '../hooks';

// ===== Discriminated union for right-rail content =====
export type RightRailContent =
  | { kind: 'entity'; entity: TimelineEntity }
  | { kind: 'theme'; theme: Theme };

interface RightRailProps {
  content: RightRailContent;
  onClose: () => void;
  onViewRelationship: (targetId: string) => void;
  onViewEntity: (entity: TimelineEntity) => void;
  onViewTheme: (theme: Theme) => void;
  pathMode: boolean;
}

export function RightRail({ content, onClose, onViewRelationship, onViewEntity, onViewTheme, pathMode }: RightRailProps) {
  const isMobile = useIsMobile();
  const panelWidth = isMobile ? 'calc(100% - 16px)' : '360px';

  const { modalRef, initialFocusRef } = useModalA11y({
    isOpen: true,
    onClose,
    lockBodyScroll: isMobile,
  });

  const label = content.kind === 'entity' ? `${content.entity.name} details` : `${content.theme.id} theme`;

  return (
    <>
      {/* Backdrop */}
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

      {/* Panel */}
      <motion.aside
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
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
        {content.kind === 'entity' ? (
          <EntityDetail
            entity={content.entity}
            onClose={onClose}
            onViewRelationship={onViewRelationship}
            onViewTheme={onViewTheme}
            pathMode={pathMode}
            initialFocusRef={initialFocusRef}
          />
        ) : (
          <ThemeDetail
            theme={content.theme}
            onClose={onClose}
            onViewEntity={onViewEntity}
            initialFocusRef={initialFocusRef}
          />
        )}
      </motion.aside>
    </>
  );
}

// ===== Entity Detail (original view) =====
function EntityDetail({
  entity,
  onClose,
  onViewRelationship,
  onViewTheme,
  pathMode,
  initialFocusRef,
}: {
  entity: TimelineEntity;
  onClose: () => void;
  onViewRelationship: (targetId: string) => void;
  onViewTheme: (theme: Theme) => void;
  pathMode: boolean;
  initialFocusRef: React.RefObject<HTMLElement | null>;
}) {
  const relatedEntities = entity.relationships
    ? timelineData.filter(e => entity.relationships?.includes(e.id))
    : [];

  const formatDate = (year: number, certainty: TimelineEntity['certainty']) =>
    `${certainty === 'approximate' ? 'c. ' : ''}${year} BC`;

  const dateLabel = entity.endYear
    ? `${formatDate(entity.startYear, entity.certainty)} - ${formatDate(entity.endYear, entity.certainty)}`
    : formatDate(entity.startYear, entity.certainty);

  const formatMetaLabel = (value: string | undefined) => {
    if (!value) return '';
    return value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <>
      <Header
        subtitle={
          (entity.type === 'person' && formatMetaLabel(entity.role)) ||
          (entity.type === 'event' && formatMetaLabel(entity.category)) ||
          (entity.type === 'book' && formatMetaLabel(entity.genre)) ||
          ''
        }
        title={entity.name}
        onClose={onClose}
        initialFocusRef={initialFocusRef}
      />

      <div className="px-6 py-6 space-y-6">
        {/* Summary */}
        <section>
          <SectionTitle>Summary</SectionTitle>
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
            <p style={{ fontSize: 'var(--type-body-sm-size)', lineHeight: 'var(--type-body-sm-line)', color: 'var(--color-base-text-primary)' }}>
              {entity.description}
            </p>
            {entity.timelineStory === 'Active' && (
              <p className="italic" style={{ fontSize: 'var(--type-label-xs-size)', color: 'var(--color-base-text-secondary)' }}>
                Dates reflect period of scriptural activity, not full lifespan.
              </p>
            )}
          </div>
        </section>

        {/* Themes */}
        {entity.themes && entity.themes.length > 0 && (
          <section>
            <SectionTitle>Themes</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {entity.themes.map(tag => {
                const theme = themeById.get(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => theme && onViewTheme(theme)}
                    className="px-3 py-1.5 rounded-full cursor-pointer transition-opacity hover:opacity-80"
                    style={{
                      background: themeColors[tag],
                      border: '1.5px solid var(--color-base-text-primary)',
                      fontSize: 'var(--type-label-xs-size)',
                      fontWeight: 600,
                      color: 'var(--color-base-text-primary)',
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Connections */}
        {relatedEntities.length > 0 && (
          <section>
            <SectionTitle>Connections</SectionTitle>
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
                  style={{ border: '1px solid var(--color-base-grid-major)', background: 'var(--color-base-surface-panel)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate" style={{ fontSize: 'var(--type-body-sm-size)', color: 'var(--color-base-text-primary)' }}>
                      {related.name}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--color-base-text-secondary)', fontSize: 'var(--type-label-xs-size)' }}>
                      {related.type === 'person' && formatMetaLabel(related.role)}
                      {related.type === 'event' && formatMetaLabel(related.category)}
                      {related.type === 'book' && formatMetaLabel(related.genre)}
                    </div>
                  </div>
                  {pathMode && <ArrowRight size={16} style={{ color: 'var(--color-base-text-secondary)' }} />}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Scripture */}
        {entity.scripture && (
          <section>
            <SectionTitle icon={<BookOpen size={14} />}>Scripture</SectionTitle>
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

        {/* Notes */}
        {entity.notes && (
          <section>
            <SectionTitle>Notes</SectionTitle>
            <p className="leading-relaxed" style={{ fontSize: 'var(--type-body-sm-size)', lineHeight: 'var(--type-body-sm-line)', color: 'var(--color-base-text-primary)' }}>
              {entity.notes}
            </p>
          </section>
        )}

        {/* Source */}
        {entity.source && (
          <section>
            <details className="group">
              <summary
                className="cursor-pointer text-sm font-semibold uppercase tracking-wide list-none flex items-center gap-1"
                style={{ color: 'var(--color-base-text-secondary)', fontSize: 'var(--type-label-xs-size)' }}
              >
                Source
                <span className="text-xs ml-1 opacity-60">+</span>
              </summary>
              <p className="mt-2" style={{ fontSize: 'var(--type-body-sm-size)', lineHeight: 'var(--type-body-sm-line)', color: 'var(--color-base-text-primary)' }}>
                {entity.source}
              </p>
            </details>
          </section>
        )}
      </div>
    </>
  );
}

// ===== Theme Detail =====
function ThemeDetail({
  theme,
  onClose,
  onViewEntity,
  initialFocusRef,
}: {
  theme: Theme;
  onClose: () => void;
  onViewEntity: (entity: TimelineEntity) => void;
  initialFocusRef: React.RefObject<HTMLElement | null>;
}) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  // Auto-derive associated entities from main data + theme overlay nodes
  const overlayNodes = themeOverlayByTheme[theme.id] || [];
  const associatedPeople = timelineData.filter(e => e.type === 'person' && e.themes?.includes(theme.id));
  const associatedEvents = timelineData.filter(e => e.type === 'event' && e.themes?.includes(theme.id));

  // Merge overlay nodes + associated events into Key Moments (deduplicated)
  // Linked overlay nodes are replaced by their main event counterpart
  const linkedIds = new Set(overlayNodes.map(n => n.linkedEntityId).filter(Boolean));
  const seenIds = new Set<string>();
  const keyMoments: TimelineEntity[] = [];
  for (const node of overlayNodes) {
    if (node.linkedEntityId) {
      // Use main event instead of overlay node
      const mainEvent = timelineData.find(e => e.id === node.linkedEntityId);
      if (mainEvent && !seenIds.has(mainEvent.id)) {
        seenIds.add(mainEvent.id);
        keyMoments.push(mainEvent);
      }
    } else {
      seenIds.add(node.id);
      keyMoments.push(node);
    }
  }
  // Add associated events not already covered
  for (const event of associatedEvents) {
    if (!seenIds.has(event.id)) {
      seenIds.add(event.id);
      keyMoments.push(event);
    }
  }
  keyMoments.sort((a, b) => b.startYear - a.startYear);

  return (
    <>
      {/* Header with colored badge */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3"
        style={{
          background: 'var(--color-base-surface-elevated)',
          borderBottom: '1px solid var(--color-base-grid-major)',
        }}
      >
        <div className="flex-1 min-w-0">
          <div
            className="inline-block px-3 py-1 rounded-full mb-2"
            style={{
              background: theme.color,
              border: '1.5px solid var(--color-base-text-primary)',
              fontSize: 'var(--type-label-xs-size)',
              fontWeight: 600,
              color: 'var(--color-base-text-primary)',
            }}
          >
            Theme
          </div>
          <h2
            className="text-2xl font-display"
            style={{
              color: 'var(--color-base-text-primary)',
              fontSize: 'var(--type-heading-2-size)',
              lineHeight: 'var(--type-heading-2-line)',
              fontWeight: 700,
            }}
          >
            {theme.id}
          </h2>
        </div>
        <button
          ref={initialFocusRef as React.RefObject<HTMLButtonElement>}
          onClick={onClose}
          className="flex-shrink-0 p-2 min-w-11 min-h-11 rounded-md transition-all hover:scale-110 flex items-center justify-center"
          style={{ border: '2px solid var(--color-base-text-primary)', background: 'var(--color-base-surface-panel)' }}
          title="Close (ESC)"
          aria-label="Close panel"
        >
          <X size={18} style={{ color: 'var(--color-base-text-primary)' }} />
        </button>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Description */}
        <section>
          <p style={{ fontSize: 'var(--type-body-sm-size)', lineHeight: 'var(--type-body-sm-line)', color: 'var(--color-base-text-secondary)' }}>
            {theme.description}
          </p>
        </section>

        {/* Theological Development */}
        {theme.theologicalDevelopment && (
          <section>
            <SectionTitle>Theological Development</SectionTitle>
            <p style={{ fontSize: 'var(--type-body-sm-size)', lineHeight: 'var(--type-body-sm-line)', color: 'var(--color-base-text-primary)' }}>
              {theme.theologicalDevelopment}
            </p>
          </section>
        )}

        {/* Associated People */}
        {associatedPeople.length > 0 && (
          <section>
            <SectionTitle>Associated People</SectionTitle>
            <div className="space-y-2">
              {associatedPeople.map(person => (
                <EntityButton key={person.id} entity={person} onClick={() => onViewEntity(person)} />
              ))}
            </div>
          </section>
        )}

        {/* Key Moments: overlay nodes + associated events, deduplicated */}
        {keyMoments.length > 0 && (
          <section>
            <SectionTitle>Key Moments</SectionTitle>
            <div className="space-y-2">
              {keyMoments.map(node => (
                <EntityButton key={node.id} entity={node} onClick={() => onViewEntity(node)} />
              ))}
            </div>
          </section>
        )}

        {/* Sources */}
        {theme.sources && theme.sources.length > 0 && (
          <section>
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-1 cursor-pointer text-sm font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-base-text-secondary)', fontSize: 'var(--type-label-xs-size)' }}
            >
              Sources
              <ChevronDown
                size={14}
                style={{
                  transform: sourcesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            {sourcesOpen && (
              <ul className="mt-2 space-y-1">
                {theme.sources.map((src, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 'var(--type-body-sm-size)',
                      lineHeight: 'var(--type-body-sm-line)',
                      color: 'var(--color-base-text-primary)',
                    }}
                  >
                    {src}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </>
  );
}

// ===== Shared sub-components =====

function Header({
  subtitle,
  title,
  onClose,
  initialFocusRef,
}: {
  subtitle: string;
  title: string;
  onClose: () => void;
  initialFocusRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <div
      className="sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3"
      style={{
        background: 'var(--color-base-surface-elevated)',
        borderBottom: '1px solid var(--color-base-grid-major)',
      }}
    >
      <div className="flex-1 min-w-0">
        {subtitle && (
          <div
            className="text-xs uppercase tracking-wide mb-1"
            style={{ color: 'var(--color-base-text-secondary)', fontSize: 'var(--type-label-xs-size)', fontWeight: 600 }}
          >
            {subtitle}
          </div>
        )}
        <h2
          className="text-2xl font-display truncate"
          style={{
            color: 'var(--color-base-text-primary)',
            fontSize: 'var(--type-heading-2-size)',
            lineHeight: 'var(--type-heading-2-line)',
            fontWeight: 700,
          }}
        >
          {title}
        </h2>
      </div>
      <button
        ref={initialFocusRef as React.RefObject<HTMLButtonElement>}
        onClick={onClose}
        className="flex-shrink-0 p-2 min-w-11 min-h-11 rounded-md transition-all hover:scale-110 flex items-center justify-center"
        style={{ border: '2px solid var(--color-base-text-primary)', background: 'var(--color-base-surface-panel)' }}
        title="Close (ESC)"
        aria-label="Close panel"
      >
        <X size={18} style={{ color: 'var(--color-base-text-primary)' }} />
      </button>
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h3
      className="text-sm font-semibold mb-2 uppercase tracking-wide flex items-center gap-2"
      style={{ color: 'var(--color-base-text-secondary)', fontSize: 'var(--type-label-xs-size)' }}
    >
      {icon}
      {children}
    </h3>
  );
}

function EntityButton({ entity, onClick }: { entity: TimelineEntity; onClick: () => void }) {
  const formatMetaLabel = (value: string | undefined) => {
    if (!value) return '';
    return value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-3 min-h-11 rounded-md flex items-center justify-between transition-all text-left hover:bg-[var(--color-base-parchment-deep)]"
      style={{ border: '1px solid var(--color-base-grid-major)', background: 'var(--color-base-surface-panel)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate" style={{ fontSize: 'var(--type-body-sm-size)', color: 'var(--color-base-text-primary)' }}>
          {entity.name}
        </div>
        <div className="text-xs truncate" style={{ color: 'var(--color-base-text-secondary)', fontSize: 'var(--type-label-xs-size)' }}>
          {entity.type === 'person' && formatMetaLabel(entity.role)}
          {entity.type === 'event' && formatMetaLabel(entity.category)}
          {entity.type === 'book' && formatMetaLabel(entity.genre)}
        </div>
      </div>
      <ArrowRight size={16} style={{ color: 'var(--color-base-text-secondary)' }} />
    </button>
  );
}
