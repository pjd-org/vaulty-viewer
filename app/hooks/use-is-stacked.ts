import * as React from 'react';

const STACK_BREAKPOINT = 1024;

export function useIsStacked() {
  const [isStacked, setIsStacked] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${STACK_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsStacked(window.innerWidth < STACK_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsStacked(window.innerWidth < STACK_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isStacked;
}
