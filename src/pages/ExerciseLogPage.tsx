import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  saveExerciseLog,
  updateExerciseLog,
} from '../api/exerciseLogs'
import type { ProgramExercise } from '../api/programExercises'
import { formatDisplayDate } from '../utils/date'
import './ExerciseLogPage.css'

type SetRow = {
  reps: string
  weight: string
}

type ExerciseLogPageProps = {
  exercise: ProgramExercise
  programName: string
  dateKey: string
  onBack: () => void
  logId?: string
  initialSets?: SetRow[]
}

const emptySet = (): SetRow => ({ reps: '', weight: '' })

function toNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function ExerciseLogPage({
  exercise,
  programName,
  dateKey,
  onBack,
  logId,
  initialSets,
}: ExerciseLogPageProps) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(logId)
  const [sets, setSets] = useState<SetRow[]>(
    initialSets && initialSets.length > 0
      ? initialSets
      : [emptySet(), emptySet(), emptySet()],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function setCount(count: number) {
    const next = Math.max(1, Math.min(12, count))
    setSets((current) =>
      Array.from({ length: next }, (_, i) => current[i] ?? emptySet()),
    )
    setSaved(false)
  }

  function updateSet(index: number, key: keyof SetRow, value: string) {
    setSets((current) =>
      current.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    )
    setSaved(false)
  }

  async function handleSubmit() {
    setError(null)
    setSaving(true)

    try {
      const hasValue = sets.some(
        (set) => set.reps.trim() !== '' || set.weight.trim() !== '',
      )
      if (!hasValue) {
        throw new Error('Enter reps or weight for at least one set.')
      }

      const payload = sets.map((set, index) => ({
        setNumber: index + 1,
        reps: toNumber(set.reps),
        weightKg: toNumber(set.weight),
      }))

      if (logId) {
        await updateExerciseLog(logId, payload)
      } else {
        await saveExerciseLog({
          programExerciseId: exercise.id,
          workoutProgramId: exercise.workout_program_id,
          dateKey,
          sets: payload,
        })
      }

      await queryClient.invalidateQueries({ queryKey: ['day-logs', dateKey] })
      await queryClient.invalidateQueries({ queryKey: ['workout-dates'] })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save sets.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="exercise-log">
      <div className="exercise-log__atmosphere" aria-hidden="true" />

      <header className="exercise-log__header">
        <button type="button" className="exercise-log__back" onClick={onBack}>
          ← {programName}
        </button>
        <h1 className="exercise-log__title">{exercise.name}</h1>
        <p className="exercise-log__date">{formatDisplayDate(dateKey)}</p>
      </header>

      <div className="exercise-log__count">
        <span>Sets</span>
        <div className="exercise-log__stepper">
          <button
            type="button"
            aria-label="Fewer sets"
            disabled={sets.length <= 1 || saving}
            onClick={() => setCount(sets.length - 1)}
          >
            −
          </button>
          <strong>{sets.length}</strong>
          <button
            type="button"
            aria-label="More sets"
            disabled={sets.length >= 12 || saving}
            onClick={() => setCount(sets.length + 1)}
          >
            +
          </button>
        </div>
      </div>

      <div className="exercise-log__sets">
        <div className="exercise-log__labels" aria-hidden="true">
          <span>Set</span>
          <span>Reps</span>
          <span>Kg</span>
        </div>

        {sets.map((set, index) => (
          <div key={index} className="exercise-log__row">
            <span className="exercise-log__num">{index + 1}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              aria-label={`Set ${index + 1} reps`}
              value={set.reps}
              disabled={saving}
              onChange={(e) => updateSet(index, 'reps', e.target.value)}
            />
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.5"
              placeholder="0"
              aria-label={`Set ${index + 1} weight`}
              value={set.weight}
              disabled={saving}
              onChange={(e) => updateSet(index, 'weight', e.target.value)}
            />
          </div>
        ))}
      </div>

      {error ? (
        <p className="exercise-log__error" role="alert">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="exercise-log__success" role="status">
          {isEditing ? 'Changes saved.' : `Saved for ${formatDisplayDate(dateKey)}.`}
        </p>
      ) : null}

      <button
        type="button"
        className="exercise-log__submit"
        disabled={saving}
        onClick={() => {
          void handleSubmit()
        }}
      >
        {saving ? 'Saving…' : isEditing ? 'Update sets' : 'Save sets'}
      </button>
    </main>
  )
}
