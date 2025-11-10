import { useMediaQuery } from './useMediaQuery'

export function useTailwindBreakpoint() {
  return {
    isSm: useMediaQuery('(min-width: 640px)'),
    isMd: useMediaQuery('(min-width: 768px)'),
    isLg: useMediaQuery('(min-width: 1024px)'),
    isXl: useMediaQuery('(min-width: 1280px)'),
    is2xl: useMediaQuery('(min-width: 1536px)')
  }
}
