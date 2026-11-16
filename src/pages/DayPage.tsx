import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteExerciseLog,
  deleteExerciseLogsForDate,
  getExerciseLogsForDate,
  type DayExerciseLog,
} from '../api/exerciseLogs'
import {
  getWorkoutPrograms,
  type WorkoutProgram,
} from '../api/workoutPrograms'
import { ConfirmModal } from '../components/ConfirmModal'
import { formatDisplayDate } from '../utils/date'
import { ExerciseLogPage } from './ExerciseLogPage'
import './DayPage.css'

type DayPageProps = {
  dateKey: string
  onBack: () => void
  onAddWorkout: (program?: WorkoutProgram) => void
  onChangeWorkout: () => void
}

type PendingAction =
  | { type: 'delete-exercise'; logId: string; name: string }
  | { type: 'change-workout' }

export function DayPage({
  dateKey,
  onBack,
  onAddWorkout,
  onChangeWorkout,
}: DayPageProps) {
  const queryClient = useQueryClient()
  const [editingLog, setEditingLog] = useState<DayExerciseLog | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

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

  async function confirmPendingAction() {
    if (!pendingAction) return

    setActionError(null)

    if (pendingAction.type === 'delete-exercise') {
      setDeletingId(pendingAction.logId)
      try {
        await deleteExerciseLog(pendingAction.logId)
        await queryClient.invalidateQueries({ queryKey: ['day-logs', dateKey] })
        await queryClient.invalidateQueries({ queryKey: ['workout-dates'] })
        await queryClient.invalidateQueries({ queryKey: ['last-workout-dates'] })
        setPendingAction(null)
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Could not delete exercise.',
        )
      } finally {
        setDeletingId(null)
      }
      return
    }

    setBusy(true)
    try {
      await deleteExerciseLogsForDate(dateKey)
      await queryClient.invalidateQueries({ queryKey: ['day-logs', dateKey] })
      await queryClient.invalidateQueries({ queryKey: ['workout-dates'] })
      await queryClient.invalidateQueries({ queryKey: ['last-workout-dates'] })
      setPendingAction(null)
      onChangeWorkout()
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not change workout.',
      )
    } finally {
      setBusy(false)
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
          exercise_kind: editingLog.exercise_kind,
        }}
        initialSets={editingLog.sets.map((set) => ({
          reps: set.reps == null ? '' : String(set.reps),
          weight: set.weight_kg == null ? '' : String(set.weight_kg),
        }))}
        initialCardioType={editingLog.cardio_type ?? ''}
        initialDurationMinutes={
          editingLog.duration_minutes == null
            ? ''
            : String(editingLog.duration_minutes)
        }
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

      {actionError ? (
        <p className="day__error" role="alert">
          {actionError}
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
                    disabled={deletingId === log.id || busy}
                    onClick={() => setEditingLog(log)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="day__delete"
                    disabled={deletingId === log.id || busy}
                    onClick={() =>
                      setPendingAction({
                        type: 'delete-exercise',
                        logId: log.id,
                        name: log.exercise_name,
                      })
                    }
                  >
                    {deletingId === log.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>

              {log.exercise_kind === 'cardio' ? (
                <p className="day__cardio-summary">
                  {log.cardio_type || 'Cardio'} · {log.duration_minutes ?? '—'}{' '}
                  min
                </p>
              ) : (
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
              )}
            </article>
          ))}
        </div>
      ) : null}

      <div className="day__footer-actions">
        <button
          type="button"
          className="day__add"
          disabled={busy}
          onClick={() => onAddWorkout(dayProgram ?? undefined)}
        >
          {dayProgram ? `Add ${dayProgram.name} exercise` : 'Choose workout'}
        </button>

        {dayProgram ? (
          <button
            type="button"
            className="day__change"
            disabled={busy}
            onClick={() => setPendingAction({ type: 'change-workout' })}
          >
            {busy ? 'Changing…' : 'Change main workout'}
          </button>
        ) : null}
      </div>

      {pendingAction?.type === 'delete-exercise' ? (
        <ConfirmModal
          danger
          busy={deletingId === pendingAction.logId}
          title="Delete exercise?"
          message={`Remove ${pendingAction.name} from this day? This cannot be undone.`}
          confirmLabel="Delete"
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            void confirmPendingAction()
          }}
        />
      ) : null}

      {pendingAction?.type === 'change-workout' ? (
        <ConfirmModal
          danger
          busy={busy}
          title="Change main workout?"
          message="All logged exercises for this day will be deleted so you can choose a different workout."
          confirmLabel="Change workout"
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            void confirmPendingAction()
          }}
        />
      ) : null}
    </main>
  )
}
