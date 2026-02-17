import { Search, ZoomIn, ZoomOut, Maximize2, X, Route } from 'lucide-react';
import { timelineData, periods, type ThemeTag } from '../data/timeline-data';

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
  showApproximate: boolean;
  onToggleApproximate: () => void;
}

const themes: ThemeTag[] = ['Covenant', 'Kingship', 'Land', 'Messiah'];

const themeColors: Record<ThemeTag, string> = {
  'Covenant': '#F4D19B',
  'Kingship': '#D4B5D4',
  'Land': '#C8D4B8',
  'Messiah': '#A8D5E2',
};

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
  showApproximate,
  onToggleApproximate,
}: TimelineToolbarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      style={{
        height: '100px',
        background: 'var(--color-base-surface-elevated)',
        borderBottom: '1px solid var(--color-base-grid-major)',
      }}
    >
      {/* Top row: Search, Period Jump, Zoom */}
      <div className="flex items-center gap-3 mb-3">
        {/* Search */}
        <div className="relative flex-shrink-0" style={{ width: '280px' }}>
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
            placeholder="Search people, events, books..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-3 py-2 rounded-md border transition-colors"
            style={{
              background: 'var(--color-base-surface-panel)',
              borderColor: 'var(--color-base-grid-major)',
              color: 'var(--color-base-text-primary)',
              fontSize: 'var(--type-body-sm-size)',
              lineHeight: 'var(--type-body-sm-line)',
            }}
          />
        </div>

        {/* Period Jump */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => onPeriodSelect(period.id)}
              className="px-3 py-1.5 rounded-md whitespace-nowrap transition-all"
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

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onZoomOut}
            disabled={zoomLevel <= 0.5}
            className="p-2 rounded-md transition-colors disabled:opacity-30"
            style={{
              border: '1px solid var(--color-base-grid-major)',
              background: 'var(--color-base-surface-panel)',
            }}
            title="Zoom out"
          >
            <ZoomOut size={16} style={{ color: 'var(--color-base-text-primary)' }} />
          </button>
          <div 
            className="px-3 py-1.5 rounded-md font-mono"
            style={{
              border: '1px solid var(--color-base-grid-major)',
              background: 'var(--color-base-surface-panel)',
              fontSize: 'var(--type-label-xs-size)',
              minWidth: '60px',
              textAlign: 'center',
            }}
          >
            {Math.round(zoomLevel * 100)}%
          </div>
          <button
            onClick={onZoomIn}
            disabled={zoomLevel >= 3}
            className="p-2 rounded-md transition-colors disabled:opacity-30"
            style={{
              border: '1px solid var(--color-base-grid-major)',
              background: 'var(--color-base-surface-panel)',
            }}
            title="Zoom in"
          >
            <ZoomIn size={16} style={{ color: 'var(--color-base-text-primary)' }} />
          </button>
          <button
            onClick={onFitView}
            className="p-2 rounded-md transition-colors"
            style={{
              border: '1px solid var(--color-base-grid-major)',
              background: 'var(--color-base-surface-panel)',
            }}
            title="Fit to view"
          >
            <Maximize2 size={16} style={{ color: 'var(--color-base-text-primary)' }} />
          </button>
        </div>
      </div>

      {/* Bottom row: Themes, Path Mode, Breadcrumbs, Certainty */}
      <div className="flex items-center gap-3 overflow-x-auto">
        {/* Theme Filters */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span 
            className="text-xs font-medium mr-1"
            style={{ 
              color: 'var(--color-base-text-secondary)',
              fontSize: 'var(--type-label-xs-size)',
            }}
          >
            Themes:
          </span>
          {themes.map((theme) => {
            const isActive = activeThemes.includes(theme);
            return (
              <button
                key={theme}
                onClick={() => onThemeToggle(theme)}
                className="px-3 py-1 rounded-full transition-all"
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

        {/* Divider */}
        <div 
          className="h-5 w-px flex-shrink-0" 
          style={{ background: 'var(--color-base-grid-major)' }} 
        />

        {/* Path Mode Toggle */}
        <button
          onClick={onPathModeToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all flex-shrink-0"
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
          <span>Path Mode {pathMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* Breadcrumb Actions */}
        {breadcrumbs.length > 0 && (
          <>
            <div 
              className="px-3 py-1 rounded-md flex-shrink-0"
              style={{
                background: 'var(--color-base-parchment-deep)',
                fontSize: 'var(--type-label-xs-size)',
                color: 'var(--color-base-text-secondary)',
              }}
            >
              Path: {breadcrumbs.length} {breadcrumbs.length === 1 ? 'node' : 'nodes'}
            </div>
            <button
              onClick={onClearBreadcrumbs}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors flex-shrink-0"
              style={{
                border: '1px solid var(--color-base-grid-major)',
                background: 'var(--color-base-surface-panel)',
                fontSize: 'var(--type-label-xs-size)',
                color: 'var(--color-base-text-primary)',
              }}
            >
              <X size={12} />
              Clear Path
            </button>
          </>
        )}

        {/* Divider */}
        <div 
          className="h-5 w-px flex-shrink-0" 
          style={{ background: 'var(--color-base-grid-major)' }} 
        />

        {/* Date Certainty Legend */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span 
            className="text-xs font-medium"
            style={{ 
              color: 'var(--color-base-text-secondary)',
              fontSize: 'var(--type-label-xs-size)',
            }}
          >
            Dates:
          </span>
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-sm"
              style={{ 
                border: '2px solid var(--color-base-text-primary)',
                background: 'var(--color-base-surface-elevated)',
              }}
            />
            <span style={{ fontSize: 'var(--type-label-xs-size)' }}>Exact</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-sm"
              style={{ 
                border: '2px dashed var(--color-base-text-secondary)',
                background: 'transparent',
              }}
            />
            <span style={{ fontSize: 'var(--type-label-xs-size)' }}>Approximate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
