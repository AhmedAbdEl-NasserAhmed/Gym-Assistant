import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWorkoutDateKeys } from '../api/exerciseLogs'
import { signOut } from '../api/auth'
import {
  addMonths,
  getMonthGrid,
  monthLabel,
  toDateKey,
} from '../utils/date'
import './CalendarPage.css'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type CalendarPageProps = {
  onSelectDate: (dateKey: string) => void
}

export function CalendarPage({ onSelectDate }: CalendarPageProps) {
  const [month, setMonth] = useState(() => new Date())
  const todayKey = toDateKey(new Date())

  const { data: workoutDays = [], isPending } = useQuery({
    queryKey: ['workout-dates', month.getFullYear(), month.getMonth()],
    queryFn: () => getWorkoutDateKeys(month),
  })

  const workoutDaySet = useMemo(() => new Set(workoutDays), [workoutDays])
  const cells = useMemo(() => getMonthGrid(month), [month])

  return (
    <main className="calendar">
      <div className="calendar__atmosphere" aria-hidden="true" />

      <header className="calendar__header">
        <div className="calendar__top">
          <p className="calendar__brand">Gym Assistant</p>
          <button
            type="button"
            className="calendar__sign-out"
            onClick={async () => {
              await signOut()
            }}
          >
            Sign out
          </button>
        </div>
        <h1 className="calendar__title">Workout calendar</h1>
        <p className="calendar__subtitle">
          Days with workouts are marked. Tap a day to open it.
        </p>
      </header>

      <div className="calendar__month-nav">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonth((current) => addMonths(current, -1))}
        >
          ‹
        </button>
        <h2>{monthLabel(month)}</h2>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonth((current) => addMonths(current, 1))}
        >
          ›
        </button>
      </div>

      <div className="calendar__weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="calendar__grid">
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="calendar__cell is-empty" />
          }

          const dateKey = toDateKey(date)
          const hasWorkout = workoutDaySet.has(dateKey)
          const isToday = dateKey === todayKey

          return (
            <button
              key={dateKey}
              type="button"
              className={[
                'calendar__cell',
                hasWorkout ? 'has-workout' : '',
                isToday ? 'is-today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(dateKey)}
            >
              <span>{date.getDate()}</span>
              {hasWorkout ? <i aria-hidden="true" /> : null}
            </button>
          )
        })}
      </div>

      {isPending ? (
        <p className="calendar__status">Loading workout days…</p>
      ) : (
        <p className="calendar__status">
          {workoutDays.length > 0
            ? `${workoutDays.length} workout day${workoutDays.length === 1 ? '' : 's'} this month`
            : 'No workouts logged this month yet'}
        </p>
      )}
    </main>
  )
}
