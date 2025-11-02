import { useRef } from 'react'

export function useDebouncedSearch<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => TReturn, ms = 300): (...args: TArgs) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (...args: TArgs) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      fn(...args)
    }, ms)
  }
}
