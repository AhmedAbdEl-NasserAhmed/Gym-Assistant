import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getWorkoutPrograms,
  type WorkoutProgram,
} from '../api/workoutPrograms'
import { formatDisplayDate } from '../utils/date'
import './WorkoutSelectPage.css'

type WorkoutSelectPageProps = {
  dateKey: string
  onBack: () => void
  onSelectProgram: (program: WorkoutProgram) => void
}

export function WorkoutSelectPage({
  dateKey,
  onBack,
  onSelectProgram,
}: WorkoutSelectPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const {
    data: programs = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['workout-programs'],
    queryFn: getWorkoutPrograms,
  })

  const selected = programs.find((program) => program.id === selectedId) ?? null
  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? 'Could not load workouts.'
        : null

  return (
    <main className="workout-select">
      <div className="workout-select__atmosphere" aria-hidden="true" />

      <header className="workout-select__header">
        <button type="button" className="workout-select__back" onClick={onBack}>
          ← {formatDisplayDate(dateKey)}
        </button>
        <h1 className="workout-select__title">Choose your workout</h1>
        <p className="workout-select__subtitle">
          This becomes the only workout for this day. After that you can only add
          its exercises.
        </p>
      </header>

      {isPending ? (
        <p className="workout-select__status">Loading workouts…</p>
      ) : null}

      {errorMessage ? (
        <p className="workout-select__error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!isPending && !errorMessage ? (
        <div
          className="workout-select__list"
          role="radiogroup"
          aria-label="Workout programs"
        >
          {programs.map((program, index) => {
            const isSelected = program.id === selectedId
            return (
              <button
                key={program.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`workout-select__option${isSelected ? ' is-selected' : ''}`}
                style={{ animationDelay: `${0.05 + index * 0.05}s` }}
                onClick={() => setSelectedId(program.id)}
              >
                <span className="workout-select__index">
                  {String(program.sort_order).padStart(2, '0')}
                </span>
                <span className="workout-select__copy">
                  <span className="workout-select__name">{program.name}</span>
                  {program.description ? (
                    <span className="workout-select__desc">
                      {program.description}
                    </span>
                  ) : null}
                </span>
                <span className="workout-select__check" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="workout-select__footer">
        <button
          type="button"
          className="workout-select__continue"
          disabled={!selected}
          onClick={() => {
            if (selected) onSelectProgram(selected)
          }}
        >
          {selected ? `Continue with ${selected.name}` : 'Select a workout'}
        </button>
      </div>
    </main>
  )
}
