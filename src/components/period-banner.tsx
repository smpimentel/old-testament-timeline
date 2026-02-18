interface BannerSection {
  label: string;
  dateRange?: string;
  startYear: number;
  endYear: number;
  bg: string;
  radius: string;
  textColor?: string;
}

const BANNER_SECTIONS: BannerSection[] = [
  {
    label: 'United Kingdom', dateRange: '1050\u2013931 BC',
    startYear: 1050, endYear: 931,
    bg: 'linear-gradient(81deg, #C1C7AA 86.28%, #ADC6C1 93.9%)',
    radius: '20px 0 0 20px', textColor: '#3A3F44',
  },
  {
    label: 'Divided Kingdom', dateRange: '931\u2013586 BC',
    startYear: 931, endYear: 586,
    bg: 'linear-gradient(158.5deg, #ABC6C3 24.57%, #EBCF88 69.87%)',
    radius: '0', textColor: '#3A3F44',
  },
  {
    label: '', startYear: 586, endYear: 571,
    bg: 'linear-gradient(to right, #EBCF88, #B7AFA3)', radius: '0',
  },
  {
    label: 'Exile', dateRange: '586\u2013538 BC',
    startYear: 571, endYear: 538,
    bg: '#B7AFA3', radius: '0', textColor: '#3A3535',
  },
  {
    label: '', startYear: 538, endYear: 523,
    bg: 'linear-gradient(to right, #B7AFA3, #B7CCA9)', radius: '0',
  },
  {
    label: 'Period of Restoration', dateRange: '538\u2013400 BC',
    startYear: 523, endYear: 400,
    bg: '#B7CCA9', radius: '0 20px 20px 0', textColor: '#3A3535',
  },
];

interface PeriodBannerProps {
  yearToX: (year: number) => number;
  topOffset: number;
}

export function PeriodBanner({ yearToX, topOffset }: PeriodBannerProps) {
  return (
    <div className="absolute pointer-events-none" style={{ left: 0, top: 0, width: '100%', height: '100%' }}>
      {BANNER_SECTIONS.map((section, i) => {
        const left = yearToX(section.startYear);
        const width = yearToX(section.endYear) - left;
        if (width <= 0) return null;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: topOffset,
              left,
              width,
              height: 224,
              background: section.bg,
              borderRadius: section.radius,
              opacity: 0.5,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
          >
            {section.label && (
              <div style={{ padding: '16px 20px' }}>
                <div style={{
                  fontFamily: 'var(--font-timeline)',
                  fontWeight: 700,
                  fontSize: 20,
                  color: section.textColor,
                }}>
                  {section.label}
                </div>
                {section.dateRange && (
                  <div style={{
                    fontFamily: 'var(--font-timeline)',
                    fontWeight: 400,
                    fontSize: 18,
                    color: 'var(--text-date)',
                    marginTop: 2,
                  }}>
                    {section.dateRange}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
