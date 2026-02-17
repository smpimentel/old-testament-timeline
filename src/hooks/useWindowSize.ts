import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

export function useIsMobile() {
  const { width } = useWindowSize();
  return width < 480;
}

export function useIsTablet() {
  const { width } = useWindowSize();
  return width >= 480 && width < 1024;
}
