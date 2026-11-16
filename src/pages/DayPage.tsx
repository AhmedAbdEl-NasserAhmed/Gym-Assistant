import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteExerciseLog,
  getExerciseLogsForDate,
  type DayExerciseLog,
} from '../api/exerciseLogs'
import {
  getWorkoutPrograms,
  type WorkoutProgram,
} from '../api/workoutPrograms'
import { DayCardioForm } from '../components/DayCardioForm'
import { formatDisplayDate } from '../utils/date'
import { ExerciseLogPage } from './ExerciseLogPage'
import './DayPage.css'

type DayPageProps = {
  dateKey: string
  onBack: () => void
  onAddWorkout: (program?: WorkoutProgram) => void
}

export function DayPage({ dateKey, onBack, onAddWorkout }: DayPageProps) {
  const queryClient = useQueryClient()
  const [editingLog, setEditingLog] = useState<DayExerciseLog | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const {
    data: logs = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['day-logs', dateKey],
    queryFn: () => getExerciseLogsForDate(dateKey),
  })

  const { data: programs = [] } = useQuery({
    queryKey: ['workout-programs'],
    queryFn: getWorkoutPrograms,
  })

  const dayProgram = useMemo(() => {
    if (logs.length === 0) return null
    const programId = logs[0].workout_program_id
    return (
      programs.find((program) => program.id === programId) ?? {
        id: programId,
        slug: '',
        name: logs[0].program_name,
        description: null,
        sort_order: 0,
      }
    )
  }, [logs, programs])

  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? 'Could not load this day.'
        : null

  async function handleDelete(logId: string, exerciseName: string) {
    const confirmed = window.confirm(`Delete ${exerciseName} from this day?`)
    if (!confirmed) return

    setDeleteError(null)
    setDeletingId(logId)

    try {
      await deleteExerciseLog(logId)
      await queryClient.invalidateQueries({ queryKey: ['day-logs', dateKey] })
      await queryClient.invalidateQueries({ queryKey: ['workout-dates'] })
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Could not delete exercise.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (editingLog) {
    return (
      <ExerciseLogPage
        dateKey={dateKey}
        programName={editingLog.program_name}
        logId={editingLog.id}
        exercise={{
          id: editingLog.program_exercise_id,
          workout_program_id: editingLog.workout_program_id,
          name: editingLog.exercise_name,
          sort_order: 0,
        }}
        initialSets={editingLog.sets.map((set) => ({
          reps: set.reps == null ? '' : String(set.reps),
          weight: set.weight_kg == null ? '' : String(set.weight_kg),
        }))}
        onBack={() => setEditingLog(null)}
      />
    )
  }

  return (
    <main className="day">
      <div className="day__atmosphere" aria-hidden="true" />

      <header className="day__header">
        <button type="button" className="day__back" onClick={onBack}>
          ← Calendar
        </button>
        <h1 className="day__title">{formatDisplayDate(dateKey)}</h1>
        <p className="day__subtitle">
          {dayProgram
            ? `${dayProgram.name} · ${logs.length} exercise${logs.length === 1 ? '' : 's'}`
            : 'No workout chosen for this day yet'}
        </p>
      </header>

      {isPending ? <p className="day__status">Loading…</p> : null}

      {errorMessage ? (
        <p className="day__error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {deleteError ? (
        <p className="day__error" role="alert">
          {deleteError}
        </p>
      ) : null}

      {!isPending && !errorMessage && logs.length > 0 ? (
        <div className="day__list">
          {logs.map((log) => (
            <article key={log.id} className="day__card">
              <div className="day__card-top">
                <div>
                  <p className="day__program">{log.program_name}</p>
                  <h2 className="day__exercise">{log.exercise_name}</h2>
                </div>
                <div className="day__actions">
                  <button
                    type="button"
                    className="day__edit"
                    disabled={deletingId === log.id}
                    onClick={() => setEditingLog(log)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="day__delete"
                    disabled={deletingId === log.id}
                    onClick={() => {
                      void handleDelete(log.id, log.exercise_name)
                    }}
                  >
                    {deletingId === log.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
              <ul className="day__sets">
                {log.sets.map((set) => (
                  <li key={set.id}>
                    <span>Set {set.set_number}</span>
                    <span>
                      {set.reps ?? '—'} reps · {set.weight_kg ?? '—'} kg
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : null}

      {dayProgram ? (
        <DayCardioForm
          dateKey={dateKey}
          workoutProgramId={dayProgram.id}
        />
      ) : null}

      <button
        type="button"
        className="day__add"
        onClick={() => onAddWorkout(dayProgram ?? undefined)}
      >
        {dayProgram ? `Add ${dayProgram.name} exercise` : 'Choose workout'}
      </button>
    </main>
  )
}
