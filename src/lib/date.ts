/**
 * Calendar and time helpers.
 *
 * The backend stores every slot as a UTC instant and tells us, per event, which
 * IANA zone it was authored in (`Event.TimeZoneId`, default Europe/Bucharest).
 * So a slot's calendar day is only meaningful in that zone — bucketing by the
 * browser's local day would put a 00:30 Bucharest slot on the previous day for a
 * visitor in London. Everything here goes through the event zone explicitly.
 */

export const MONTHS_RO = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
]

/** Monday-first, as Romanian calendars are printed. */
export const WEEKDAYS_SHORT_RO = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
export const WEEKDAYS_LONG_RO = [
  'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică',
]

export interface YearMonth {
  year: number
  /** 1-12, not the 0-11 that Date uses — too easy to misread otherwise. */
  month: number
}

export interface GridDay {
  /** Day of month, 1-31. */
  day: number
  /** `YYYY-MM-DD`, the key slots are bucketed under. */
  key: string
  /** False for the leading/trailing days borrowed from adjacent months. */
  inMonth: boolean
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** 0 = Monday … 6 = Sunday. JS gives 0 = Sunday, which the grid never wants. */
function mondayIndex(year: number, month: number, day: number): number {
  const js = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return (js + 6) % 7
}

/**
 * Builds a whole-weeks grid for the month: always starts on a Monday, always
 * ends on a Sunday, padded with the neighbouring months' days so the grid is
 * rectangular. Returns 35 or 42 cells depending on how the month falls.
 */
export function monthGrid({ year, month }: YearMonth): GridDay[] {
  const lead = mondayIndex(year, month, 1)
  const total = daysInMonth(year, month)

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevTotal = daysInMonth(prevYear, prevMonth)

  const cells: GridDay[] = []

  for (let i = lead; i > 0; i--) {
    const day = prevTotal - i + 1
    cells.push({ day, key: dateKey(prevYear, prevMonth, day), inMonth: false })
  }
  for (let day = 1; day <= total; day++) {
    cells.push({ day, key: dateKey(year, month, day), inMonth: true })
  }

  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  let day = 1
  while (cells.length % 7 !== 0) {
    cells.push({ day, key: dateKey(nextYear, nextMonth, day), inMonth: false })
    day++
  }

  return cells
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const zeroBased = year * 12 + (month - 1) + delta
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 }
}

export function monthLabel({ year, month }: YearMonth): string {
  const name = MONTHS_RO[month - 1]
  return `${name.charAt(0).toLocaleUpperCase('ro-RO')}${name.slice(1)} ${year}`
}

/**
 * Which calendar day a UTC instant falls on, *in the event's zone*.
 * `en-CA` is used purely because it formats as `YYYY-MM-DD`.
 */
export function zonedDayKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

export function zonedTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function zonedWeekdayLong(iso: string, timeZone: string): string {
  const name = new Intl.DateTimeFormat('ro-RO', { timeZone, weekday: 'long' }).format(
    new Date(iso),
  )
  return `${name.charAt(0).toLocaleUpperCase('ro-RO')}${name.slice(1)}`
}

/** "14 octombrie" from a `YYYY-MM-DD` key. */
export function dayMonthLabel(key: string): string {
  const [, month, day] = key.split('-').map(Number)
  return `${day} ${MONTHS_RO[month - 1]}`
}

export function weekdayLongFromKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number)
  return WEEKDAYS_LONG_RO[mondayIndex(year, month, day)]
}

export function minutesBetween(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000)
}

export function todayKey(timeZone: string): string {
  return zonedDayKey(new Date().toISOString(), timeZone)
}
