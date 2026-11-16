import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteCardioLog,
  getCardioLogForDate,
  saveCardioLog,
} from '../api/cardioLogs'

type DayCardioFormProps = {
  dateKey: string
  workoutProgramId: string
}

export function DayCardioForm({
  dateKey,
  workoutProgramId,
}: DayCardioFormProps) {
  const queryClient = useQueryClient()
  const { data: cardio } = useQuery({
    queryKey: ['day-cardio', dateKey],
    queryFn: () => getCardioLogForDate(dateKey),
  })

  const [cardioType, setCardioType] = useState('')
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCardioType(cardio?.cardio_type ?? '')
    setDuration(
      cardio?.duration_minutes == null ? '' : String(cardio.duration_minutes),
    )
  }, [cardio])

  async function handleSave() {
    setError(null)
    setMessage(null)
    setSaving(true)

    try {
      const type = cardioType.trim()
      const minutes = Number(duration)

      if (!type) throw new Error('Enter a cardio type.')
      if (!Number.isFinite(minutes) || minutes <= 0) {
        throw new Error('Enter a valid time in minutes.')
      }

      await saveCardioLog({
        dateKey,
        workoutProgramId,
        cardioType: type,
        durationMinutes: minutes,
      })

      await queryClient.invalidateQueries({ queryKey: ['day-cardio', dateKey] })
      await queryClient.invalidateQueries({ queryKey: ['workout-dates'] })
      setMessage('Cardio saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save cardio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!cardio) return
    const confirmed = window.confirm('Remove cardio from this day?')
    if (!confirmed) return

    setError(null)
    setMessage(null)
    setSaving(true)

    try {
      await deleteCardioLog(dateKey)
      await queryClient.invalidateQueries({ queryKey: ['day-cardio', dateKey] })
      await queryClient.invalidateQueries({ queryKey: ['workout-dates'] })
      setCardioType('')
      setDuration('')
      setMessage('Cardio removed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete cardio.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="day__cardio">
      <h2 className="day__cardio-title">Cardio</h2>
      <p className="day__cardio-hint">Type and time only for this workout.</p>

      <div className="day__cardio-grid">
        <label className="day__cardio-field">
          <span>Type</span>
          <input
            type="text"
            placeholder="Treadmill, bike…"
            value={cardioType}
            disabled={saving}
            onChange={(e) => setCardioType(e.target.value)}
          />
        </label>
        <label className="day__cardio-field">
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

      {error ? (
        <p className="day__error" role="alert">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="day__success" role="status">
          {message}
        </p>
      ) : null}

      <div className="day__cardio-actions">
        <button
          type="button"
          className="day__cardio-save"
          disabled={saving}
          onClick={() => {
            void handleSave()
          }}
        >
          {saving ? 'Saving…' : cardio ? 'Update cardio' : 'Save cardio'}
        </button>
        {cardio ? (
          <button
            type="button"
            className="day__cardio-delete"
            disabled={saving}
            onClick={() => {
              void handleDelete()
            }}
          >
            Remove
          </button>
        ) : null}
      </div>
    </section>
  )
}
