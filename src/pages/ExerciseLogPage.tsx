import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { saveExerciseLog, updateExerciseLog } from '../api/exerciseLogs'
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
  onSaved?: () => void
  logId?: string
  initialSets?: SetRow[]
  initialCardioType?: string
  initialDurationMinutes?: string
  initialRir?: string
  initialNote?: string
}

const emptySet = (): SetRow => ({ reps: '', weight: '' })

function toNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseRir(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10) {
    throw new Error('RIR must be a whole number from 0 to 10.')
  }
  return parsed
}

export function ExerciseLogPage({
  exercise,
  programName,
  dateKey,
  onBack,
  onSaved,
  logId,
  initialSets,
  initialCardioType = '',
  initialDurationMinutes = '',
  initialRir = '',
  initialNote = '',
}: ExerciseLogPageProps) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(logId)
  const isCardio = exercise.exercise_kind === 'cardio'

  const [sets, setSets] = useState<SetRow[]>(
    initialSets && initialSets.length > 0
      ? initialSets
      : [emptySet(), emptySet(), emptySet()],
  )
  const [cardioType, setCardioType] = useState(initialCardioType)
  const [duration, setDuration] = useState(initialDurationMinutes)
  const [rir, setRir] = useState(initialRir)
  const [note, setNote] = useState(initialNote)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setCount(count: number) {
    const next = Math.max(1, Math.min(12, count))
    setSets((current) =>
      Array.from({ length: next }, (_, i) => current[i] ?? emptySet()),
    )
  }

  function updateSet(index: number, key: keyof SetRow, value: string) {
    setSets((current) =>
      current.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    )
  }

  async function handleSubmit() {
    setError(null)
    setSaving(true)

    try {
      const extras = {
        rir: parseRir(rir),
        note: note.trim() === '' ? null : note.trim(),
      }

      if (isCardio) {
        const type = cardioType.trim()
        const minutes = Number(duration)
        if (!type) throw new Error('Enter a cardio type.')
        if (!Number.isFinite(minutes) || minutes <= 0) {
          throw new Error('Enter a valid time in minutes.')
        }

        if (logId) {
          await updateExerciseLog(logId, {
            kind: 'cardio',
            cardioType: type,
            durationMinutes: minutes,
            ...extras,
          })
        } else {
          await saveExerciseLog({
            kind: 'cardio',
            programExerciseId: exercise.id,
            workoutProgramId: exercise.workout_program_id,
            dateKey,
            cardioType: type,
            durationMinutes: minutes,
            ...extras,
          })
        }
      } else {
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
          await updateExerciseLog(logId, {
            kind: 'strength',
            sets: payload,
            ...extras,
          })
        } else {
          await saveExerciseLog({
            kind: 'strength',
            programExerciseId: exercise.id,
            workoutProgramId: exercise.workout_program_id,
            dateKey,
            sets: payload,
            ...extras,
          })
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['day-logs', dateKey] })
      await queryClient.invalidateQueries({ queryKey: ['workout-dates'] })
      await queryClient.invalidateQueries({ queryKey: ['last-workout-dates'] })
      ;(onSaved ?? onBack)()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
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

      {isCardio ? (
        <div className="exercise-log__cardio">
          <label className="exercise-log__field">
            <span>Type</span>
            <input
              type="text"
              placeholder="Treadmill, bike…"
              value={cardioType}
              disabled={saving}
              onChange={(e) => setCardioType(e.target.value)}
            />
          </label>
          <label className="exercise-log__field">
            <span>Time (min)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.5"
              placeholder="20"
              value={duration}
              disabled={saving}
              onChange={(e) => setDuration(e.target.value)}
            />
          </label>
        </div>
      ) : (
        <>
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
        </>
      )}

      <div className="exercise-log__meta">
        <label className="exercise-log__field">
          <span>RIR</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            step={1}
            placeholder="0–10"
            value={rir}
            disabled={saving}
            onChange={(e) => setRir(e.target.value)}
          />
        </label>
        <label className="exercise-log__field">
          <span>Note</span>
          <textarea
            rows={3}
            placeholder="Form, pain, pump…"
            value={note}
            disabled={saving}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      {error ? (
        <p className="exercise-log__error" role="alert">
          {error}
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
        {saving
          ? 'Saving…'
          : isEditing
            ? isCardio
              ? 'Update cardio'
              : 'Update sets'
            : isCardio
              ? 'Save cardio'
              : 'Save sets'}
      </button>
    </main>
  )
}
