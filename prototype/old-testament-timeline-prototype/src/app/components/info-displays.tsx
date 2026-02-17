import { X, Link2, BookOpen, User, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { TimelineEntity } from '../data/timeline-data';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

// Tier 1: Tooltip (hover)
interface TooltipCardProps {
  entity: TimelineEntity;
  x: number;
  y: number;
}

export function TooltipCard({ entity, x, y }: TooltipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 100,
      }}
      className="bg-popover border border-border rounded-lg shadow-xl p-3 max-w-xs pointer-events-none"
    >
      <div className="flex items-start gap-2 mb-1">
        {entity.type === 'person' && <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
        {entity.type === 'book' && <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
        {entity.type === 'event' && <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <h4 className="m-0 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            {entity.name}
          </h4>
          <div className="text-xs text-muted-foreground mt-0.5">
            {entity.endYear ? `${entity.startYear}–${entity.endYear} BC` : `${entity.startYear} BC`}
          </div>
        </div>
      </div>
      <p className="text-xs text-foreground/80 m-0">{entity.description}</p>
      {entity.themes && entity.themes.length > 0 && (
        <div className="flex gap-1 mt-2">
          {entity.themes.map((theme) => (
            <span
              key={theme}
              className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent-foreground rounded"
            >
              {theme}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Tier 2: Detail Card (click)
interface DetailCardProps {
  entity: TimelineEntity;
  onClose: () => void;
  onViewRelationship: (targetId: string) => void;
  onOpenSidePanel: () => void;
}

export function DetailCard({ entity, onClose, onViewRelationship, onOpenSidePanel }: DetailCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-lg shadow-2xl w-full max-w-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border bg-secondary/30">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {entity.type === 'person' && (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
          )}
          {entity.type === 'book' && (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
          )}
          {entity.type === 'event' && (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="m-0" style={{ fontFamily: 'var(--font-display)' }}>
              {entity.name}
            </h3>
            <div className="text-sm text-muted-foreground mt-1">
              {entity.endYear ? `${entity.startYear}–${entity.endYear} BC` : `${entity.startYear} BC`}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0 -mr-2">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Description</div>
          <p className="text-sm m-0">{entity.description}</p>
        </div>

        {entity.details && (
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Details</div>
            <p className="text-sm text-foreground/80 m-0">{entity.details}</p>
          </div>
        )}

        {entity.themes && entity.themes.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Themes</div>
            <div className="flex flex-wrap gap-1.5">
              {entity.themes.map((theme) => (
                <span
                  key={theme}
                  className="text-xs px-2 py-1 bg-accent/20 text-accent-foreground rounded-md"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {entity.relationships && entity.relationships.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              Related Entities
            </div>
            <div className="space-y-1">
              {entity.relationships.map((rel, idx) => (
                <button
                  key={idx}
                  onClick={() => onViewRelationship(rel.targetId)}
                  className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent/10 transition-colors flex items-center gap-2"
                >
                  <span className="text-xs text-muted-foreground capitalize">{rel.type}</span>
                  <span className="text-foreground">{rel.targetId}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-secondary/20">
        <Button onClick={onOpenSidePanel} className="w-full">
          View Full Details
        </Button>
      </div>
    </motion.div>
  );
}

// Tier 3: Side Panel (deep dive)
interface SidePanelProps {
  entity: TimelineEntity;
  onClose: () => void;
  onViewRelationship: (targetId: string) => void;
  allEntities: TimelineEntity[];
}

export function SidePanel({ entity, onClose, onViewRelationship, allEntities }: SidePanelProps) {
  const getRelatedEntity = (id: string) => {
    return allEntities.find(e => e.id === id);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-sidebar border-l border-sidebar-border shadow-2xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-sidebar-border bg-sidebar-accent/30">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {entity.type === 'person' && (
            <div className="w-12 h-12 rounded-full bg-sidebar-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-sidebar-primary" />
            </div>
          )}
          {entity.type === 'book' && (
            <div className="w-12 h-12 rounded-full bg-sidebar-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-sidebar-primary" />
            </div>
          )}
          {entity.type === 'event' && (
            <div className="w-12 h-12 rounded-full bg-sidebar-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-sidebar-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="m-0" style={{ fontFamily: 'var(--font-display)' }}>
              {entity.name}
            </h2>
            <div className="text-sm text-sidebar-foreground/60 mt-1.5">
              {entity.endYear ? `${entity.startYear}–${entity.endYear} BC` : `${entity.startYear} BC`}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="w-9 h-9 p-0">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Type */}
          <div>
            <div className="text-xs uppercase tracking-wide text-sidebar-foreground/50 mb-2">Type</div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sidebar-accent rounded-md">
              <span className="capitalize text-sm">{entity.type}</span>
              <span className="text-xs text-sidebar-foreground/50">Priority {entity.priority}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs uppercase tracking-wide text-sidebar-foreground/50 mb-2">Overview</div>
            <p className="text-base m-0 leading-relaxed">{entity.description}</p>
          </div>

          {/* Details */}
          {entity.details && (
            <div>
              <div className="text-xs uppercase tracking-wide text-sidebar-foreground/50 mb-2">Historical Context</div>
              <p className="text-base text-sidebar-foreground/80 m-0 leading-relaxed">{entity.details}</p>
            </div>
          )}

          {/* Themes */}
          {entity.themes && entity.themes.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-sidebar-foreground/50 mb-2">Theological Themes</div>
              <div className="flex flex-wrap gap-2">
                {entity.themes.map((theme) => (
                  <span
                    key={theme}
                    className="px-3 py-1.5 bg-sidebar-primary/10 text-sidebar-primary rounded-md text-sm"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Context */}
          <div>
            <div className="text-xs uppercase tracking-wide text-sidebar-foreground/50 mb-2">Timeline</div>
            <div className="bg-sidebar-accent rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-sidebar-foreground/60">Start</span>
                <span className="font-medium">{entity.startYear} BC</span>
              </div>
              {entity.endYear && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-sidebar-foreground/60">End</span>
                    <span className="font-medium">{entity.endYear} BC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-sidebar-foreground/60">Duration</span>
                    <span className="font-medium">{entity.startYear - entity.endYear} years</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Relationships */}
          {entity.relationships && entity.relationships.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-sidebar-foreground/50 mb-3 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                Connected Entities
              </div>
              <div className="space-y-2">
                {entity.relationships.map((rel, idx) => {
                  const relatedEntity = getRelatedEntity(rel.targetId);
                  return (
                    <button
                      key={idx}
                      onClick={() => onViewRelationship(rel.targetId)}
                      className="w-full text-left p-3 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/70 transition-colors border border-sidebar-border"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-sidebar-foreground/50 capitalize">{rel.type}</span>
                        {relatedEntity && (
                          <span className="text-xs text-sidebar-foreground/50 capitalize">{relatedEntity.type}</span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-sidebar-foreground">
                        {relatedEntity?.name || rel.targetId}
                      </div>
                      {relatedEntity && (
                        <div className="text-xs text-sidebar-foreground/60 mt-1">
                          {relatedEntity.endYear 
                            ? `${relatedEntity.startYear}–${relatedEntity.endYear} BC` 
                            : `${relatedEntity.startYear} BC`}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="pt-4 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/50 leading-relaxed">
              This is a prototype visualization. Historical dates are approximate and based on traditional scholarship.
            </div>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}

// Backdrop overlay for detail card
export function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
    />
  );
}
