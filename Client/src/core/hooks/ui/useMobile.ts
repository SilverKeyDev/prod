import { useState, useEffect } from 'react';

const useMobile = (query: string = '(max-width: 1024px)') => {
  const [isMobile, setIsMobile] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return isMobile;
};

export default useMobile;
