import { X, Hand, Search as SearchIcon, Filter, MousePointer2, ZoomIn, Route } from 'lucide-react';
import { motion } from 'motion/react';
import { useModalA11y } from '../hooks';

interface WelcomeOverlayProps {
  onClose: () => void;
}

export function WelcomeOverlay({ onClose }: WelcomeOverlayProps) {
  const { modalRef, initialFocusRef } = useModalA11y({
    isOpen: true,
    onClose,
    lockBodyScroll: true,
  });

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(45, 36, 28, 0.4)', backdropFilter: 'blur(8px)' }}
      />

      {/* Content */}
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
      >
        <div
          className="rounded-xl shadow-2xl overflow-hidden"
          style={{
            background: 'var(--color-base-surface-elevated)',
            border: '2px solid var(--color-base-grid-major)',
          }}
        >
          {/* Header */}
          <div 
            className="p-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--color-theme-egyptian-amber) 0%, var(--color-theme-mediterranean-blue) 100%)',
            }}
          >
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D241C' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            />
            <div className="relative">
              <h2
                id="welcome-title"
                className="m-0 mb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--type-display-1-size)',
                  lineHeight: 'var(--type-display-1-line)',
                  fontWeight: 700,
                  color: 'var(--color-base-text-primary)',
                }}
              >
                Old Testament Timeline
              </h2>
              <p 
                className="m-0"
                style={{
                  fontSize: 'var(--type-body-md-size)',
                  lineHeight: 'var(--type-body-md-line)',
                  color: 'var(--color-base-text-secondary)',
                }}
              >
                Explore over 3,600 years of biblical history through an interactive journey
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-11 h-11 p-0 rounded-md transition-colors flex items-center justify-center"
              style={{
                background: 'rgba(45, 36, 28, 0.1)',
                border: '1px solid var(--color-base-text-primary)',
              }}
              aria-label="Close welcome overlay"
            >
              <X className="w-5 h-5" style={{ color: 'var(--color-base-text-primary)' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Navigation */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-theme-olive-grove)' }}
                  >
                    <Hand className="w-5 h-5" style={{ color: 'var(--color-base-text-primary)' }} />
                  </div>
                  <div>
                    <h4 
                      className="m-0"
                      style={{
                        fontSize: 'var(--type-body-md-size)',
                        fontWeight: 600,
                        color: 'var(--color-base-text-primary)',
                      }}
                    >
                      Pan & Navigate
                    </h4>
                    <p 
                      className="m-0"
                      style={{
                        fontSize: 'var(--type-label-xs-size)',
                        color: 'var(--color-base-text-secondary)',
                      }}
                    >
                      Click and drag to explore
                    </p>
                  </div>
                </div>
              </div>

              {/* Zoom */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-theme-mediterranean-blue)' }}
                  >
                    <ZoomIn className="w-5 h-5" style={{ color: 'var(--color-base-text-primary)' }} />
                  </div>
                  <div>
                    <h4 
                      className="m-0"
                      style={{
                        fontSize: 'var(--type-body-md-size)',
                        fontWeight: 600,
                        color: 'var(--color-base-text-primary)',
                      }}
                    >
                      Zoom
                    </h4>
                    <p 
                      className="m-0"
                      style={{
                        fontSize: 'var(--type-label-xs-size)',
                        color: 'var(--color-base-text-secondary)',
                      }}
                    >
                      Scroll wheel to zoom in/out
                    </p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-theme-egyptian-amber)' }}
                  >
                    <SearchIcon className="w-5 h-5" style={{ color: 'var(--color-base-text-primary)' }} />
                  </div>
                  <div>
                    <h4 
                      className="m-0"
                      style={{
                        fontSize: 'var(--type-body-md-size)',
                        fontWeight: 600,
                        color: 'var(--color-base-text-primary)',
                      }}
                    >
                      Search
                    </h4>
                    <p 
                      className="m-0"
                      style={{
                        fontSize: 'var(--type-label-xs-size)',
                        color: 'var(--color-base-text-secondary)',
                      }}
                    >
                      Find people, events, books
                    </p>
                  </div>
                </div>
              </div>

              {/* Select */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-theme-roman-purple)' }}
                  >
                    <MousePointer2 className="w-5 h-5" style={{ color: 'var(--color-base-text-primary)' }} />
                  </div>
                  <div>
                    <h4 
                      className="m-0"
                      style={{
                        fontSize: 'var(--type-body-md-size)',
                        fontWeight: 600,
                        color: 'var(--color-base-text-primary)',
                      }}
                    >
                      Select
                    </h4>
                    <p 
                      className="m-0"
                      style={{
                        fontSize: 'var(--type-label-xs-size)',
                        color: 'var(--color-base-text-secondary)',
                      }}
                    >
                      Click entities for details
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Path Mode Feature */}
            <div 
              className="p-4 rounded-lg"
              style={{
                background: 'var(--color-base-parchment-deep)',
                border: '1.5px solid var(--color-theme-egyptian-amber)',
              }}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-theme-egyptian-amber)' }}
                >
                  <Route className="w-5 h-5" style={{ color: 'var(--color-base-text-primary)' }} />
                </div>
                <div>
                  <h4 
                    className="m-0 mb-1"
                    style={{
                      fontSize: 'var(--type-body-md-size)',
                      fontWeight: 600,
                      color: 'var(--color-base-text-primary)',
                    }}
                  >
                    Path Mode
                  </h4>
                  <p 
                    className="m-0"
                    style={{
                      fontSize: 'var(--type-body-sm-size)',
                      lineHeight: 'var(--type-body-sm-line)',
                      color: 'var(--color-base-text-secondary)',
                    }}
                  >
                    Enable Path Mode to build breadcrumb exploration paths by clicking through related entities. Connect people, events, and books to visualize their relationships across time.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div 
              className="pt-4"
              style={{ borderTop: '1px solid var(--color-base-grid-major)' }}
            >
              <h4 
                className="m-0 mb-3 flex items-center gap-2"
                style={{
                  fontSize: 'var(--type-body-md-size)',
                  fontWeight: 600,
                  color: 'var(--color-base-text-primary)',
                }}
              >
                <Filter className="w-4 h-4" style={{ color: 'var(--color-theme-egyptian-amber)' }} />
                Exploration Tips
              </h4>
              <ul 
                className="space-y-2 m-0 pl-6"
                style={{
                  fontSize: 'var(--type-body-sm-size)',
                  lineHeight: 'var(--type-body-sm-line)',
                  color: 'var(--color-base-text-primary)',
                }}
              >
                <li>Use <strong>theme filters</strong> (Covenant, Kingship, Land, Messiah) to highlight connected entities</li>
                <li>Try searching for <strong>"David"</strong>, <strong>"Moses"</strong>, or <strong>"Exodus"</strong> to jump to key moments</li>
                <li>Toggle <strong>Path Mode ON</strong> and click through connections to build exploration paths</li>
                <li>Zoom in to reveal detailed entities with role badges and date certainty indicators</li>
              </ul>
            </div>

            {/* Date Legend */}
            <div 
              className="pt-4"
              style={{ borderTop: '1px solid var(--color-base-grid-major)' }}
            >
              <h4 
                className="m-0 mb-3"
                style={{
                  fontSize: 'var(--type-body-md-size)',
                  fontWeight: 600,
                  color: 'var(--color-base-text-primary)',
                }}
              >
                Date Certainty
              </h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-sm"
                    style={{ 
                      border: '2px solid var(--color-base-text-primary)',
                      background: 'var(--color-base-surface-elevated)',
                    }}
                  />
                  <span style={{ fontSize: 'var(--type-body-sm-size)' }}>Exact dates</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-sm"
                    style={{ 
                      border: '2px dashed var(--color-base-text-secondary)',
                      background: 'transparent',
                    }}
                  />
                  <span style={{ fontSize: 'var(--type-body-sm-size)' }}>Approximate dates (c.)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div 
            className="px-8 py-4"
            style={{
              background: 'var(--color-base-parchment-deep)',
              borderTop: '1px solid var(--color-base-grid-major)',
            }}
          >
            <button
              ref={initialFocusRef as React.RefObject<HTMLButtonElement>}
              onClick={onClose}
              className="w-full py-3 min-h-11 rounded-lg transition-all font-semibold"
              style={{
                background: 'var(--color-base-text-primary)',
                color: 'var(--color-base-surface-elevated)',
                fontSize: 'var(--type-body-md-size)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Begin Exploration
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
