import { useQuery } from '@tanstack/react-query'
import { getProgramExercises } from '../api/programExercises'
import type { WorkoutProgram } from '../api/workoutPrograms'
import './ProgramExercisesPage.css'

type ProgramExercisesPageProps = {
  program: WorkoutProgram
  onBack: () => void
}

export function ProgramExercisesPage({
  program,
  onBack,
}: ProgramExercisesPageProps) {
  const {
    data: exercises = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['program-exercises', program.id],
    queryFn: () => getProgramExercises(program.id),
  })

  const errorMessage =
    error instanceof Error ? error.message : error ? 'Could not load exercises.' : null

  return (
    <main className="program-exercises">
      <div className="program-exercises__atmosphere" aria-hidden="true" />

      <header className="program-exercises__header">
        <button type="button" className="program-exercises__back" onClick={onBack}>
          ← Workouts
        </button>
        <p className="program-exercises__brand">Gym Assistant</p>
        <h1 className="program-exercises__title">{program.name}</h1>
        <p className="program-exercises__subtitle">
          {exercises.length > 0
            ? `${exercises.length} exercises in this workout`
            : 'Exercises for this workout'}
        </p>
      </header>

      {isPending ? (
        <p className="program-exercises__status">Loading exercises…</p>
      ) : null}

      {errorMessage ? (
        <p className="program-exercises__error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!isPending && !errorMessage && exercises.length === 0 ? (
        <p className="program-exercises__status">
          No exercises linked yet. You can add them next.
        </p>
      ) : null}

      {!isPending && !errorMessage && exercises.length > 0 ? (
        <ol className="program-exercises__list">
          {exercises.map((exercise, index) => (
            <li
              key={exercise.id}
              className="program-exercises__item"
              style={{ animationDelay: `${0.04 + index * 0.04}s` }}
            >
              <span className="program-exercises__num">
                {String(exercise.sort_order).padStart(2, '0')}
              </span>
              <span className="program-exercises__name">{exercise.name}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </main>
  )
}
