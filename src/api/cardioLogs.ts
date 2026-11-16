import { supabase } from '../utils/supabase'

export type CardioLog = {
  id: string
  workout_program_id: string
  date_key: string
  cardio_type: string
  duration_minutes: number
}

export async function getCardioLogForDate(
  dateKey: string,
): Promise<CardioLog | null> {
  const { data, error } = await supabase
    .from('workout_cardio_logs')
    .select('id, workout_program_id, date_key, cardio_type, duration_minutes')
    .eq('date_key', dateKey)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function saveCardioLog(input: {
  dateKey: string
  workoutProgramId: string
  cardioType: string
  durationMinutes: number
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('You must be signed in to save cardio.')

  const { data, error } = await supabase
    .from('workout_cardio_logs')
    .upsert(
      {
        user_id: user.id,
        workout_program_id: input.workoutProgramId,
        date_key: input.dateKey,
        cardio_type: input.cardioType.trim(),
        duration_minutes: input.durationMinutes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date_key' },
    )
    .select('id, workout_program_id, date_key, cardio_type, duration_minutes')
    .single()

  if (error) throw error
  return data as CardioLog
}

export async function deleteCardioLog(dateKey: string) {
  const { error } = await supabase
    .from('workout_cardio_logs')
    .delete()
    .eq('date_key', dateKey)

  if (error) throw error
}
