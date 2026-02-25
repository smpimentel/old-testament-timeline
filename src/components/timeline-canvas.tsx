import { TIMELINE_WIDTH } from '@/hooks';

interface TimelineCanvasProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  canvasEventHandlers: Record<string, (e: never) => void>;
  panX: number;
  panY: number;
  zoomLevel: number;
  isDragging: boolean;
  sidebarWidth: number;
  railWidth: number;
  selectedEntityOpen: boolean;
  foundationHeight: number;
  children: React.ReactNode;
}

export function TimelineCanvas({
  canvasRef,
  canvasEventHandlers,
  panX,
  panY,
  zoomLevel,
  isDragging,
  sidebarWidth,
  railWidth,
  selectedEntityOpen,
  foundationHeight,
  children,
}: TimelineCanvasProps) {
  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        top: 0,
        left: sidebarWidth,
        transition: 'left var(--motion-expressive) var(--motion-easing)',
        background: '#F5EDD6',
        right: selectedEntityOpen ? `${railWidth}px` : '0',
      }}
      {...canvasEventHandlers}
    >
      <div
        style={{
          position: 'relative',
          isolation: 'isolate',
          background: '#F5EDD6',
          width: TIMELINE_WIDTH,
          height: foundationHeight,
          transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
