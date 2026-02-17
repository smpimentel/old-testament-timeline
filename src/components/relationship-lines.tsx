import { motion } from 'motion/react';

interface RelationshipLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  type: 'family' | 'covenant' | 'prophecy' | 'authored' | 'witnessed' | 'breadcrumb';
  isAnimated?: boolean;
}

export function RelationshipLine({ 
  startX, 
  startY, 
  endX, 
  endY, 
  type, 
  isAnimated = false 
}: RelationshipLineProps) {
  const getLineStyle = () => {
    switch (type) {
      case 'family':
        return {
          stroke: 'var(--color-base-text-secondary)',
          strokeWidth: 2,
          strokeDasharray: '0',
          opacity: 0.6,
        };
      case 'covenant':
        return {
          stroke: 'var(--color-theme-egyptian-amber)',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          opacity: 0.7,
        };
      case 'prophecy':
        return {
          stroke: 'var(--color-theme-mediterranean-blue)',
          strokeWidth: 2,
          strokeDasharray: '3,3',
          opacity: 0.7,
        };
      case 'breadcrumb':
        return {
          stroke: 'var(--color-theme-egyptian-amber)',
          strokeWidth: 3,
          strokeDasharray: '8,4',
          opacity: 0.9,
        };
      default:
        return {
          stroke: 'var(--color-base-text-secondary)',
          strokeWidth: 1.5,
          strokeDasharray: '2,2',
          opacity: 0.4,
        };
    }
  };

  const style = getLineStyle();

  // Create a curved path
  const controlPointX = (startX + endX) / 2;
  const controlPointY = Math.min(startY, endY) - Math.abs(endX - startX) * 0.2;
  
  const path = `M ${startX} ${startY} Q ${controlPointX} ${controlPointY} ${endX} ${endY}`;

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 5,
      }}
    >
      <motion.path
        d={path}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        opacity={style.opacity}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: 1, 
          opacity: style.opacity,
          ...(isAnimated && type === 'breadcrumb' && {
            strokeDashoffset: [0, -20],
          })
        }}
        transition={{ 
          pathLength: { duration: 0.5, ease: 'easeInOut' },
          opacity: { duration: 0.3 },
          ...(isAnimated && type === 'breadcrumb' && {
            strokeDashoffset: { 
              duration: 1, 
              repeat: Infinity, 
              ease: 'linear' 
            }
          })
        }}
      />
      {/* Arrow head for breadcrumbs */}
      {type === 'breadcrumb' && (
        <motion.polygon
          points={`${endX},${endY} ${endX - 8},${endY - 5} ${endX - 8},${endY + 5}`}
          fill={style.stroke}
          initial={{ opacity: 0 }}
          animate={{ opacity: style.opacity }}
          transition={{ duration: 0.3, delay: 0.5 }}
        />
      )}
    </svg>
  );
}