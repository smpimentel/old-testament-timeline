import { Search, ZoomIn, ZoomOut, Maximize2, X, Route } from 'lucide-react';
import { periods, themeTags, themeColors, type ThemeTag } from '../data/timeline-data';

interface TimelineToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  selectedPeriod: string | null;
  onPeriodSelect: (periodId: string) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  activeThemes: ThemeTag[];
  onThemeToggle: (theme: ThemeTag) => void;
  breadcrumbs: string[];
  onClearBreadcrumbs: () => void;
  pathMode: boolean;
  onPathModeToggle: () => void;
}

export function TimelineToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedPeriod,
  onPeriodSelect,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onFitView,
  activeThemes,
  onThemeToggle,
  breadcrumbs,
  onClearBreadcrumbs,
  pathMode,
  onPathModeToggle,
}: TimelineToolbarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <div
      className="toolbar-container fixed top-0 left-0 right-0 z-50 px-3 py-2 md:px-4 md:py-3"
      style={{
        background: 'var(--color-base-surface-elevated)',
        borderBottom: '1px solid var(--color-base-grid-major)',
      }}
    >
      {/* Row 1: Search + Zoom (mobile: stacked, tablet+: inline) */}
      <div className="toolbar-row-1 flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
        {/* Search */}
        <div className="toolbar-search relative flex-1 min-w-0" style={{ maxWidth: '280px' }}>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: '16px',
              height: '16px',
              color: 'var(--color-base-text-secondary)'
            }}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search people, events, and books"
            className="toolbar-search-input w-full pl-10 pr-3 py-2 min-h-11 rounded-md border transition-colors"
            style={{
              background: 'var(--color-base-surface-panel)',
              borderColor: 'var(--color-base-grid-major)',
              color: 'var(--color-base-text-primary)',
              fontSize: 'var(--type-body-sm-size)',
              lineHeight: 'var(--type-body-sm-line)',
            }}
          />
        </div>

        {/* Zoom Controls - always visible */}
        <div className="toolbar-zoom flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onZoomOut}
            disabled={zoomLevel <= 0.5}
            className="toolbar-btn p-2 min-w-11 min-h-11 rounded-md transition-colors disabled:opacity-30 flex items-center justify-center"
            style={{
              border: '1px solid var(--color-base-grid-major)',
              background: 'var(--color-base-surface-panel)',
            }}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} style={{ color: 'var(--color-base-text-primary)' }} />
          </button>
          <div
            className="toolbar-zoom-display px-2 py-1.5 rounded-md font-mono hidden sm:block"
            style={{
              border: '1px solid var(--color-base-grid-major)',
              background: 'var(--color-base-surface-panel)',
              fontSize: 'var(--type-label-xs-size)',
              minWidth: '52px',
              textAlign: 'center',
            }}
          >
            {Math.round(zoomLevel * 100)}%
          </div>
          <button
            onClick={onZoomIn}
            disabled={zoomLevel >= 3}
            className="toolbar-btn p-2 min-w-11 min-h-11 rounded-md transition-colors disabled:opacity-30 flex items-center justify-center"
            style={{
              border: '1px solid var(--color-base-grid-major)',
              background: 'var(--color-base-surface-panel)',
            }}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} style={{ color: 'var(--color-base-text-primary)' }} />
          </button>
          <button
            onClick={onFitView}
            className="toolbar-btn p-2 min-w-11 min-h-11 rounded-md transition-colors flex items-center justify-center"
            style={{
              border: '1px solid var(--color-base-grid-major)',
              background: 'var(--color-base-surface-panel)',
            }}
            title="Fit to view"
            aria-label="Fit to view"
          >
            <Maximize2 size={16} style={{ color: 'var(--color-base-text-primary)' }} />
          </button>
        </div>
      </div>

      {/* Row 2: Period Jump - scrollable on mobile */}
      <div className="toolbar-row-2 flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 mb-2 md:mb-3 -mx-3 px-3 md:mx-0 md:px-0">
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => onPeriodSelect(period.id)}
            aria-pressed={selectedPeriod === period.id}
            className="toolbar-period-btn px-2 py-2 min-h-11 min-w-11 rounded-md whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: selectedPeriod === period.id
                ? period.color
                : 'transparent',
              border: selectedPeriod === period.id
                ? '1.5px solid var(--color-base-text-primary)'
                : '1px solid var(--color-base-grid-major)',
              color: 'var(--color-base-text-primary)',
              fontSize: 'var(--type-label-xs-size)',
              lineHeight: 'var(--type-label-xs-line)',
              fontWeight: selectedPeriod === period.id ? 600 : 500,
            }}
          >
            {period.name}
          </button>
        ))}
      </div>

      {/* Row 3: Themes, Path Mode, Breadcrumbs - scrollable */}
      <div className="toolbar-row-3 flex items-center gap-2 md:gap-3 overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 pb-1">
        {/* Theme Filters */}
        <div className="toolbar-themes flex items-center gap-1 flex-shrink-0">
          <span
            className="hidden sm:inline text-xs font-medium mr-1"
            style={{
              color: 'var(--color-base-text-secondary)',
              fontSize: 'var(--type-label-xs-size)',
            }}
          >
            Themes:
          </span>
          {themeTags.map((theme) => {
            const isActive = activeThemes.includes(theme);
            return (
              <button
                key={theme}
                onClick={() => onThemeToggle(theme)}
                aria-pressed={isActive}
                className="toolbar-theme-btn px-2 py-2 min-h-11 rounded-full transition-all flex items-center justify-center"
                style={{
                  background: isActive ? themeColors[theme] : 'transparent',
                  border: `1.5px solid ${isActive ? themeColors[theme] : 'var(--color-base-grid-major)'}`,
                  color: 'var(--color-base-text-primary)',
                  fontSize: 'var(--type-label-xs-size)',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {theme}
              </button>
            );
          })}
        </div>

        {/* Divider - hidden on mobile */}
        <div
          className="toolbar-divider hidden sm:block h-5 w-px flex-shrink-0"
          style={{ background: 'var(--color-base-grid-major)' }}
        />

        {/* Path Mode Toggle */}
        <button
          onClick={onPathModeToggle}
          aria-pressed={pathMode}
          className="toolbar-path-btn flex items-center gap-1 px-2 py-2 min-h-11 rounded-md transition-all flex-shrink-0"
          style={{
            background: pathMode ? 'var(--color-theme-egyptian-amber)' : 'transparent',
            border: pathMode
              ? '1.5px solid var(--color-base-text-primary)'
              : '1px solid var(--color-base-grid-major)',
            color: 'var(--color-base-text-primary)',
            fontSize: 'var(--type-label-xs-size)',
            fontWeight: pathMode ? 600 : 500,
          }}
        >
          <Route size={14} />
          <span className="hidden sm:inline">Path {pathMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* Breadcrumb Actions */}
        {breadcrumbs.length > 0 && (
          <>
            <div
              className="toolbar-breadcrumb-count px-2 py-1 rounded-md flex-shrink-0"
              style={{
                background: 'var(--color-base-parchment-deep)',
                fontSize: 'var(--type-label-xs-size)',
                color: 'var(--color-base-text-secondary)',
              }}
            >
              {breadcrumbs.length}
            </div>
            <button
              onClick={onClearBreadcrumbs}
              className="toolbar-clear-btn flex items-center gap-1 px-2 py-2 min-h-11 rounded-md transition-colors flex-shrink-0"
              style={{
                border: '1px solid var(--color-base-grid-major)',
                background: 'var(--color-base-surface-panel)',
                fontSize: 'var(--type-label-xs-size)',
                color: 'var(--color-base-text-primary)',
              }}
            >
              <X size={12} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </>
        )}

        {/* Divider - hidden on mobile */}
        <div
          className="toolbar-divider hidden md:block h-5 w-px flex-shrink-0"
          style={{ background: 'var(--color-base-grid-major)' }}
        />

        {/* Date Certainty Legend - hidden on mobile, shown on tablet+ */}
        <div className="toolbar-legend hidden md:flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-medium"
            style={{
              color: 'var(--color-base-text-secondary)',
              fontSize: 'var(--type-label-xs-size)',
            }}
          >
            Dates:
          </span>
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                border: '2px solid var(--color-base-text-primary)',
                background: 'var(--color-base-surface-elevated)',
              }}
            />
            <span style={{ fontSize: 'var(--type-label-xs-size)' }}>Exact</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                border: '2px dashed var(--color-base-text-secondary)',
                background: 'transparent',
              }}
            />
            <span style={{ fontSize: 'var(--type-label-xs-size)' }}>Approx</span>
          </div>
        </div>
      </div>
    </div>
  );
}
