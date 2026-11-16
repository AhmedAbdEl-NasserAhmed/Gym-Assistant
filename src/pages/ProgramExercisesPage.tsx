import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getProgramExercises,
  type ProgramExercise,
} from '../api/programExercises'
import type { WorkoutProgram } from '../api/workoutPrograms'
import { ExerciseLogPage } from './ExerciseLogPage'
import './ProgramExercisesPage.css'

type ProgramExercisesPageProps = {
  program: WorkoutProgram
  dateKey: string
  onBack: () => void
}

export function ProgramExercisesPage({
  program,
  dateKey,
  onBack,
}: ProgramExercisesPageProps) {
  const [selectedExercise, setSelectedExercise] =
    useState<ProgramExercise | null>(null)

  const {
    data: exercises = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['program-exercises', program.id],
    queryFn: () => getProgramExercises(program.id),
  })

  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? 'Could not load exercises.'
        : null

  if (selectedExercise) {
    return (
      <ExerciseLogPage
        exercise={selectedExercise}
        programName={program.name}
        dateKey={dateKey}
        onBack={() => setSelectedExercise(null)}
      />
    )
  }

  return (
    <main className="program-exercises">
      <div className="program-exercises__atmosphere" aria-hidden="true" />

      <header className="program-exercises__header">
        <button type="button" className="program-exercises__back" onClick={onBack}>
          ← Day
        </button>
        <p className="program-exercises__brand">Gym Assistant</p>
        <h1 className="program-exercises__title">{program.name}</h1>
        <p className="program-exercises__subtitle">
          {exercises.length > 0
            ? `${exercises.length} exercises · tap one to log sets`
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
        <div className="program-exercises__list" role="list">
          {exercises.map((exercise, index) => (
            <button
              key={exercise.id}
              type="button"
              role="listitem"
              className="program-exercises__item"
              style={{ animationDelay: `${0.04 + index * 0.04}s` }}
              onClick={() => setSelectedExercise(exercise)}
            >
              <span className="program-exercises__num">
                {String(exercise.sort_order).padStart(2, '0')}
              </span>
              <span className="program-exercises__name">{exercise.name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </main>
  )
}
