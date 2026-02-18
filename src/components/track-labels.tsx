interface TrackLabelsProps {
  tracks: {
    events: { baseY: number };
    people: { baseY: number };
    books: { baseY: number };
  };
  startX: number;
}

const LABEL_STYLE = {
  color: '#6F6254',
  fontSize: 'var(--type-label-xs-size)',
  fontWeight: 600,
  fontFamily: 'var(--font-timeline)',
} as const;

export function TrackLabels({ tracks, startX }: TrackLabelsProps) {
  return (
    <div className="absolute pointer-events-none" style={{ left: startX + 8 }}>
      {(['events', 'people', 'books'] as const).map((type) => (
        <div
          key={type}
          className="absolute px-3 py-1.5 rounded-md shadow-sm"
          style={{
            top: tracks[type].baseY - 28,
            background: 'var(--color-base-surface-elevated)',
            border: '1px solid #E3D7C4',
          }}
        >
          <div className="text-xs uppercase tracking-wide" style={LABEL_STYLE}>
            {type === 'events' ? 'Events' : type === 'people' ? 'People' : 'Books'}
          </div>
        </div>
      ))}
    </div>
  );
}
