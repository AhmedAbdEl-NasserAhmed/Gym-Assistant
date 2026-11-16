import { supabase } from '../utils/supabase'
import { dayRangeIso, toDateKey } from '../utils/date'

export type ExerciseSetInput = {
  setNumber: number
  reps: number | null
  weightKg: number | null
}

export type SaveExerciseLogInput = {
  programExerciseId: string
  workoutProgramId: string
  dateKey: string
  sets: ExerciseSetInput[]
}

export type ExerciseLogSet = {
  id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
}

export type DayExerciseLog = {
  id: string
  performed_at: string
  program_exercise_id: string
  workout_program_id: string
  exercise_name: string
  program_name: string
  sets: ExerciseLogSet[]
}

export async function saveExerciseLog({
  programExerciseId,
  workoutProgramId,
  dateKey,
  sets,
}: SaveExerciseLogInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('You must be signed in to save sets.')

  const performedAt = new Date(`${dateKey}T12:00:00`).toISOString()

  const { data: log, error: logError } = await supabase
    .from('exercise_logs')
    .insert({
      user_id: user.id,
      program_exercise_id: programExerciseId,
      workout_program_id: workoutProgramId,
      performed_at: performedAt,
    })
    .select('id')
    .single()

  if (logError) throw logError

  const { error: setsError } = await supabase.from('exercise_log_sets').insert(
    sets.map((set) => ({
      exercise_log_id: log.id,
      set_number: set.setNumber,
      reps: set.reps,
      weight_kg: set.weightKg,
    })),
  )

  if (setsError) {
    await supabase.from('exercise_logs').delete().eq('id', log.id)
    throw setsError
  }

  return log
}

export async function deleteExerciseLog(logId: string) {
  const { error } = await supabase
    .from('exercise_logs')
    .delete()
    .eq('id', logId)

  if (error) throw error
}

export async function updateExerciseLog(
  logId: string,
  sets: ExerciseSetInput[],
) {
  const { error: deleteError } = await supabase
    .from('exercise_log_sets')
    .delete()
    .eq('exercise_log_id', logId)

  if (deleteError) throw deleteError

  const { error: insertError } = await supabase.from('exercise_log_sets').insert(
    sets.map((set) => ({
      exercise_log_id: logId,
      set_number: set.setNumber,
      reps: set.reps,
      weight_kg: set.weightKg,
    })),
  )

  if (insertError) throw insertError
}

export async function getWorkoutDateKeys(
  monthDate: Date,
): Promise<string[]> {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
  const startKey = toDateKey(start)
  const endKey = toDateKey(end)

  const [exerciseResult, cardioResult] = await Promise.all([
    supabase
      .from('exercise_logs')
      .select('performed_at')
      .gte('performed_at', start.toISOString())
      .lt('performed_at', end.toISOString()),
    supabase
      .from('workout_cardio_logs')
      .select('date_key')
      .gte('date_key', startKey)
      .lt('date_key', endKey),
  ])

  if (exerciseResult.error) throw exerciseResult.error
  if (cardioResult.error) throw cardioResult.error

  const keys = new Set<string>()
  for (const row of exerciseResult.data ?? []) {
    keys.add(toDateKey(new Date(row.performed_at)))
  }
  for (const row of cardioResult.data ?? []) {
    keys.add(row.date_key)
  }

  return Array.from(keys)
}

export async function getExerciseLogsForDate(
  dateKey: string,
): Promise<DayExerciseLog[]> {
  const { start, end } = dayRangeIso(dateKey)

  const { data, error } = await supabase
    .from('exercise_logs')
    .select(
      `
      id,
      performed_at,
      program_exercise_id,
      workout_program_id,
      program_exercises ( name ),
      workout_programs ( name ),
      exercise_log_sets (
        id,
        set_number,
        reps,
        weight_kg
      )
    `,
    )
    .gte('performed_at', start)
    .lt('performed_at', end)
    .order('performed_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const exercise = row.program_exercises as { name: string } | null
    const program = row.workout_programs as { name: string } | null
    const sets = (
      (row.exercise_log_sets as ExerciseLogSet[] | null) ?? []
    ).slice().sort((a, b) => a.set_number - b.set_number)

    return {
      id: row.id,
      performed_at: row.performed_at,
      program_exercise_id: row.program_exercise_id,
      workout_program_id: row.workout_program_id,
      exercise_name: exercise?.name ?? 'Exercise',
      program_name: program?.name ?? 'Workout',
      sets,
    }
  })
}
