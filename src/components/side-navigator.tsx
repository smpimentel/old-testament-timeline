import { useState } from 'react';
import { Search, Route, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { periods, themeColors, type ThemeTag } from '../data/timeline-data';

/** Only show 4 primary themes in the sidebar */
const NAV_THEMES: ThemeTag[] = ['Covenant', 'Kingship', 'Land', 'Messiah'];

/** Periods hidden from sidebar nav */
const HIDDEN_PERIODS = new Set(['dates-unknown']);

export const SIDEBAR_WIDTH_OPEN = 220;
export const SIDEBAR_WIDTH_CLOSED = 60;

interface SideNavigatorProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  selectedPeriod: string | null;
  onPeriodSelect: (periodId: string) => void;
  activeThemes: ThemeTag[];
  onThemeToggle: (theme: ThemeTag) => void;
  breadcrumbs: string[];
  onClearBreadcrumbs: () => void;
  pathMode: boolean;
  onPathModeToggle: () => void;
  isOpen: boolean;
  onToggle: () => void;
  showSecularContext: boolean;
  onSecularContextToggle: () => void;
}

/** Divider line matching Figma */
function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: 'var(--color-base-grid-major)',
        margin: '0 10px',
      }}
    />
  );
}

/** Section header — shrinks font & removes tracking in collapsed mode */
function SectionHeader({ children, isOpen }: { children: string; isOpen: boolean }) {
  return (
    <p
      style={{
        fontSize: isOpen ? 'var(--type-label-xs-size)' : '10px',
        lineHeight: isOpen ? 'var(--type-label-xs-line)' : '14px',
        letterSpacing: isOpen ? '0.05em' : '0.02em',
        color: 'var(--color-base-text-secondary)',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        textTransform: 'uppercase',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        padding: isOpen ? '0 4px' : '0 2px',
        marginBottom: 8,
      }}
    >
      {children}
    </p>
  );
}

export function SideNavigator({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedPeriod,
  onPeriodSelect,
  activeThemes,
  onThemeToggle,
  breadcrumbs,
  onClearBreadcrumbs,
  pathMode,
  onPathModeToggle,
  isOpen,
  onToggle,
  showSecularContext,
  onSecularContextToggle,
}: SideNavigatorProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearchSubmit();
  };

  const width = isOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
  // Collapsed: tight padding so content fits in 60px
  const sectionPx = isOpen ? 12 : 6;

  return (
    <nav
      className="fixed top-0 left-0 bottom-0 z-50 flex flex-col"
      style={{
        width,
        background: 'var(--color-base-surface-elevated)',
        borderRight: '1px solid var(--color-base-grid-major)',
        transition: 'width var(--motion-expressive) var(--motion-easing)',
        overflowX: 'hidden',
        overflowY: 'hidden',
      }}
      aria-label="Timeline navigation"
    >
      {/* Toggle Button */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          justifyContent: isOpen ? 'flex-end' : 'center',
          padding: isOpen ? '10px 12px' : '10px 0',
          minHeight: 48,
        }}
      >
        <button
          onClick={onToggle}
          className="flex items-center justify-center rounded-md transition-colors hover:bg-[var(--color-base-parchment-deep)]"
          style={{ width: 36, height: 36 }}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? (
            <PanelLeftClose size={18} style={{ color: 'var(--color-base-text-secondary)' }} />
          ) : (
            <PanelLeftOpen size={18} style={{ color: 'var(--color-base-text-secondary)' }} />
          )}
        </button>
      </div>

      {/* Scrollable content — hidden scrollbar */}
      <div
        className="flex-1 overflow-x-hidden"
        style={{
          overflowY: 'auto',
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none' as React.CSSProperties['msOverflowStyle'],
        }}
      >
        {/* Search Section */}
        <div style={{ padding: `10px ${sectionPx}px` }}>
          {isOpen ? (
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                size={14}
                style={{ color: 'var(--color-base-text-secondary)' }}
              />
              <input
                type="text"
                placeholder="Search people, events, books"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                aria-label="Search people, events, and books"
                className="w-full pl-8 pr-2 py-2 rounded-md border transition-colors"
                style={{
                  background: 'var(--color-base-surface-panel)',
                  borderColor: searchFocused ? 'var(--color-base-focus)' : 'var(--color-base-grid-major)',
                  color: 'var(--color-base-text-primary)',
                  fontSize: 'var(--type-label-xs-size)',
                  lineHeight: 'var(--type-label-xs-line)',
                  height: 36,
                }}
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onToggle}
                className="flex items-center justify-center rounded-full transition-colors hover:bg-[var(--color-base-parchment-deep)]"
                style={{
                  width: 36,
                  height: 36,
                  background: searchQuery ? 'var(--color-theme-egyptian-amber)' : 'var(--color-base-surface-panel)',
                  border: '1px solid var(--color-base-grid-major)',
                }}
                aria-label="Open search"
                title="Search"
              >
                <Search size={14} style={{ color: 'var(--color-base-text-primary)' }} />
              </button>
            </div>
          )}
        </div>

        <Divider />

        {/* Themes Section */}
        <div style={{ padding: `10px ${sectionPx}px` }}>
          <SectionHeader isOpen={isOpen}>Themes</SectionHeader>
          <div
            className="flex flex-col items-center"
            style={{ gap: isOpen ? 6 : 8 }}
          >
            {NAV_THEMES.map((theme) => {
              const isActive = activeThemes.includes(theme);
              const color = themeColors[theme];
              return isOpen ? (
                <button
                  key={theme}
                  onClick={() => onThemeToggle(theme)}
                  aria-pressed={isActive}
                  className="w-full px-3 py-1.5 rounded-full transition-all text-center"
                  style={{
                    background: isActive ? color : 'transparent',
                    border: `1.5px solid ${isActive ? color : 'var(--color-base-grid-major)'}`,
                    color: 'var(--color-base-text-primary)',
                    fontSize: 'var(--type-label-xs-size)',
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {theme}
                </button>
              ) : (
                <button
                  key={theme}
                  onClick={() => onThemeToggle(theme)}
                  aria-pressed={isActive}
                  aria-label={theme}
                  title={theme}
                  className="flex items-center justify-center rounded-full transition-all flex-shrink-0"
                  style={{
                    width: 30,
                    height: 30,
                    background: isActive ? color : 'transparent',
                    border: `1.5px solid ${isActive ? color : 'var(--color-base-grid-major)'}`,
                    color: 'var(--color-base-text-primary)',
                    fontSize: 'var(--type-label-xs-size)',
                    fontWeight: 700,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {theme[0]}
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* Filters Section */}
        <div style={{ padding: `10px ${sectionPx}px` }}>
          <SectionHeader isOpen={isOpen}>Filters</SectionHeader>
          <div className="flex flex-col items-center" style={{ gap: isOpen ? 6 : 8 }}>
            {isOpen ? (
              <button
                onClick={onSecularContextToggle}
                aria-pressed={showSecularContext}
                className="w-full px-3 py-1.5 rounded-full transition-all text-center"
                style={{
                  background: showSecularContext ? '#B8B0A8' : 'transparent',
                  border: `1.5px solid ${showSecularContext ? '#B8B0A8' : 'var(--color-base-grid-major)'}`,
                  color: 'var(--color-base-text-primary)',
                  fontSize: 'var(--type-label-xs-size)',
                  fontWeight: showSecularContext ? 600 : 500,
                  fontFamily: 'var(--font-body)',
                }}
              >
                Historical Events
              </button>
            ) : (
              <button
                onClick={onSecularContextToggle}
                aria-pressed={showSecularContext}
                aria-label="Historical Events"
                title="Historical Events"
                className="flex items-center justify-center rounded-full transition-all flex-shrink-0"
                style={{
                  width: 30,
                  height: 30,
                  background: showSecularContext ? '#B8B0A8' : 'transparent',
                  border: `1.5px solid ${showSecularContext ? '#B8B0A8' : 'var(--color-base-grid-major)'}`,
                  color: 'var(--color-base-text-primary)',
                  fontSize: 'var(--type-label-xs-size)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                }}
              >
                H
              </button>
            )}
          </div>
        </div>

        <Divider />

        {/* Periods Section */}
        <div style={{ padding: `10px ${sectionPx}px` }}>
          <SectionHeader isOpen={isOpen}>Periods</SectionHeader>
          <div
            className="flex flex-col items-center"
            style={{ gap: isOpen ? 5 : 4 }}
          >
            {periods.filter(p => !HIDDEN_PERIODS.has(p.id)).map((period) => {
              const isSelected = selectedPeriod === period.id;
              return isOpen ? (
                <button
                  key={period.id}
                  onClick={() => onPeriodSelect(period.id)}
                  aria-pressed={isSelected}
                  className="w-full px-3 py-1.5 rounded-md transition-all text-left"
                  style={{
                    background: isSelected ? period.color : 'transparent',
                    border: isSelected
                      ? '1.5px solid var(--color-base-text-primary)'
                      : '1px solid var(--color-base-grid-major)',
                    color: 'var(--color-base-text-primary)',
                    fontSize: 'var(--type-label-xs-size)',
                    fontWeight: isSelected ? 600 : 500,
                    fontFamily: 'var(--font-body)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {period.name}
                </button>
              ) : (
                <button
                  key={period.id}
                  onClick={() => onPeriodSelect(period.id)}
                  aria-pressed={isSelected}
                  aria-label={period.name}
                  title={period.name}
                  className="flex items-center justify-center rounded-full transition-all flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    background: isSelected ? period.color : period.color + '33', /* 20% opacity */
                    border: isSelected
                      ? '2px solid var(--color-base-text-primary)'
                      : '1.5px solid ' + period.color,
                  }}
                />
              );
            })}
          </div>
        </div>

        <Divider />

        {/* Pathfinder Section */}
        <div style={{ padding: `10px ${sectionPx}px` }}>
          {isOpen ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={onPathModeToggle}
                aria-pressed={pathMode}
                className="flex items-center gap-2 px-3 py-2 rounded-md transition-all w-full"
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
                <span>Path {pathMode ? 'ON' : 'OFF'}</span>
              </button>

              {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className="px-2 py-1 rounded-md text-center flex-1"
                    style={{
                      background: 'var(--color-base-parchment-deep)',
                      fontSize: 'var(--type-label-xs-size)',
                      color: 'var(--color-base-text-secondary)',
                    }}
                  >
                    {breadcrumbs.length} crumb{breadcrumbs.length !== 1 ? 's' : ''}
                  </div>
                  <button
                    onClick={onClearBreadcrumbs}
                    className="flex items-center justify-center rounded-md transition-colors"
                    style={{
                      width: 28,
                      height: 28,
                      border: '1px solid var(--color-base-grid-major)',
                      background: 'var(--color-base-surface-panel)',
                    }}
                    aria-label="Clear breadcrumbs"
                    title="Clear path"
                  >
                    <X size={12} style={{ color: 'var(--color-base-text-primary)' }} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={onPathModeToggle}
                aria-pressed={pathMode}
                aria-label={`Path mode ${pathMode ? 'on' : 'off'}`}
                title={`Pathfinder ${pathMode ? 'ON' : 'OFF'}`}
                className="flex items-center justify-center rounded-md transition-all"
                style={{
                  width: 36,
                  height: 36,
                  background: pathMode ? 'var(--color-theme-egyptian-amber)' : 'transparent',
                  border: pathMode
                    ? '1.5px solid var(--color-base-text-primary)'
                    : '1px solid var(--color-base-grid-major)',
                }}
              >
                <Route size={14} style={{ color: 'var(--color-base-text-primary)' }} />
              </button>

              {breadcrumbs.length > 0 && (
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 22,
                    height: 22,
                    background: 'var(--color-theme-egyptian-amber)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--color-base-text-primary)',
                  }}
                >
                  {breadcrumbs.length}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* WebKit scrollbar hide (injected inline via style tag) */}
      <style>{`
        nav[aria-label="Timeline navigation"] > div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </nav>
  );
}
