interface UnknownEraBandProps {
  startX: number;
  width: number;
  mainSectionTop: number;
  mainSectionHeight: number;
}

export function UnknownEraBand({
  startX,
  width,
  mainSectionTop,
  mainSectionHeight,
}: UnknownEraBandProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: startX,
        top: mainSectionTop,
        width,
        height: mainSectionHeight,
        background: 'rgba(245, 237, 214, 0.34)',
        borderRight: '1px solid rgba(111, 98, 84, 0.18)',
      }}
    />
  );
}
