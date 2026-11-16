export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDisplayDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function getMonthGrid(date: Date): Array<Date | null> {
  const first = startOfMonth(date)
  const totalDays = endOfMonth(date).getDate()
  const startWeekday = first.getDay() // 0 Sunday
  const cells: Array<Date | null> = Array.from(
    { length: startWeekday },
    () => null,
  )

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(date.getFullYear(), date.getMonth(), day))
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export function dayRangeIso(dateKey: string): { start: string; end: string } {
  const start = parseDateKey(dateKey)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}
