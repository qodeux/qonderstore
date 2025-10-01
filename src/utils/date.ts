export function toDate(v: unknown) {
  if (v == null) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  if (typeof v === 'number') {
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof v === 'string') {
    // Soporta ISO tipo: 2025-10-01T11:06:06.42084+00:00
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

export function formatRelativeTime(date: Date, locale = 'es') {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const diffMs = date.getTime() - Date.now()
  const abs = Math.abs(diffMs)

  if (abs < 60_000) return rtf.format(Math.round(diffMs / 1000), 'second')
  if (abs < 3_600_000) return rtf.format(Math.round(diffMs / 60_000), 'minute')
  if (abs < 86_400_000) return rtf.format(Math.round(diffMs / 3_600_000), 'hour')
  if (abs < 7 * 86_400_000) return rtf.format(Math.round(diffMs / 86_400_000), 'day')
  if (abs < 30 * 86_400_000) return rtf.format(Math.round(diffMs / (7 * 86_400_000)), 'week')
  if (abs < 365 * 86_400_000) return rtf.format(Math.round(diffMs / 2_629_800_000), 'month') // ~30.44d
  return rtf.format(Math.round(diffMs / 31_557_600_000), 'year') // ~365.25d
}

export function formatDate(
  value: unknown,
  preset: 'full' | 'only-date' | 'relative' | 'time' = 'full',
  locale = 'es-MX',
  timeZone?: string
): string {
  const d = toDate(value)
  if (!d) return ''

  if (preset === 'relative') {
    return formatRelativeTime(d, locale)
  }

  const opts: Intl.DateTimeFormatOptions =
    preset === 'only-date'
      ? { year: '2-digit', month: '2-digit', day: '2-digit', timeZone }
      : preset === 'time'
      ? { hour: '2-digit', minute: '2-digit', hour12: true, timeZone }
      : { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true, timeZone }

  // En es-MX, obtendrás algo tipo "01/10/25 11:45 p. m." (puede variar por navegador)
  return new Intl.DateTimeFormat(locale, opts).format(d).replace(',', '')
}
