const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const groupedFormatter = new Intl.NumberFormat('en')
const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** Compact counts for badges: 1234 -> "1.2K", 1500000 -> "1.5M". */
export function formatCount(value: number): string {
  return compactFormatter.format(value)
}

/** Grouped integers for prose: 1234567 -> "1,234,567". */
export function formatNumber(value: number): string {
  return groupedFormatter.format(value)
}

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
]

/** Human relative time, e.g. "3 days ago". Returns '' for unparseable input. */
export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  let duration = (date.getTime() - now.getTime()) / 1000 // negative = past
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeFormatter.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return ''
}

// A small subset of GitHub's linguist colors for the language dot; anything not
// listed falls back to a neutral grey.
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Java: '#b07219',
  Go: '#00add8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
}

export function languageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? '#8b949e'
}
