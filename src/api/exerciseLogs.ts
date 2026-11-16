import { supabase } from '../utils/supabase'
import type { ExerciseKind } from './programExercises'
import { dayRangeIso, toDateKey } from '../utils/date'

export type ExerciseSetInput = {
  setNumber: number
  reps: number | null
  weightKg: number | null
}

export type SaveStrengthLogInput = {
  kind: 'strength'
  programExerciseId: string
  workoutProgramId: string
  dateKey: string
  sets: ExerciseSetInput[]
}

export type SaveCardioLogInput = {
  kind: 'cardio'
  programExerciseId: string
  workoutProgramId: string
  dateKey: string
  cardioType: string
  durationMinutes: number
}

export type SaveExerciseLogInput = SaveStrengthLogInput | SaveCardioLogInput

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
  exercise_kind: ExerciseKind
  program_name: string
  cardio_type: string | null
  duration_minutes: number | null
  sets: ExerciseLogSet[]
}

async function requireUser() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('You must be signed in to save.')
  return user
}

export async function saveExerciseLog(input: SaveExerciseLogInput) {
  const user = await requireUser()
  const performedAt = new Date(`${input.dateKey}T12:00:00`).toISOString()

  if (input.kind === 'cardio') {
    const { data: log, error } = await supabase
      .from('exercise_logs')
      .insert({
        user_id: user.id,
        program_exercise_id: input.programExerciseId,
        workout_program_id: input.workoutProgramId,
        performed_at: performedAt,
        cardio_type: input.cardioType.trim(),
        duration_minutes: input.durationMinutes,
      })
      .select('id')
      .single()

    if (error) throw error
    return log
  }

  const { data: log, error: logError } = await supabase
    .from('exercise_logs')
    .insert({
      user_id: user.id,
      program_exercise_id: input.programExerciseId,
      workout_program_id: input.workoutProgramId,
      performed_at: performedAt,
    })
    .select('id')
    .single()

  if (logError) throw logError

  const { error: setsError } = await supabase.from('exercise_log_sets').insert(
    input.sets.map((set) => ({
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

export async function deleteExerciseLogsForDate(dateKey: string) {
  const { start, end } = dayRangeIso(dateKey)
  const { error } = await supabase
    .from('exercise_logs')
    .delete()
    .gte('performed_at', start)
    .lt('performed_at', end)

  if (error) throw error
}

export async function updateExerciseLog(
  logId: string,
  input:
    | { kind: 'strength'; sets: ExerciseSetInput[] }
    | { kind: 'cardio'; cardioType: string; durationMinutes: number },
) {
  if (input.kind === 'cardio') {
    const { error } = await supabase
      .from('exercise_logs')
      .update({
        cardio_type: input.cardioType.trim(),
        duration_minutes: input.durationMinutes,
      })
      .eq('id', logId)

    if (error) throw error

    await supabase.from('exercise_log_sets').delete().eq('exercise_log_id', logId)
    return
  }

  const { error: clearCardioError } = await supabase
    .from('exercise_logs')
    .update({
      cardio_type: null,
      duration_minutes: null,
    })
    .eq('id', logId)

  if (clearCardioError) throw clearCardioError

  const { error: deleteError } = await supabase
    .from('exercise_log_sets')
    .delete()
    .eq('exercise_log_id', logId)

  if (deleteError) throw deleteError

  const { error: insertError } = await supabase.from('exercise_log_sets').insert(
    input.sets.map((set) => ({
      exercise_log_id: logId,
      set_number: set.setNumber,
      reps: set.reps,
      weight_kg: set.weightKg,
    })),
  )

  if (insertError) throw insertError
}

export async function getWorkoutDateKeys(monthDate: Date): Promise<string[]> {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)

  const { data, error } = await supabase
    .from('exercise_logs')
    .select('performed_at')
    .gte('performed_at', start.toISOString())
    .lt('performed_at', end.toISOString())

  if (error) throw error

  const keys = new Set<string>()
  for (const row of data ?? []) {
    keys.add(toDateKey(new Date(row.performed_at)))
  }

  return Array.from(keys)
}

/** Most recent logged date key per workout program for the signed-in user. */
export async function getLastWorkoutDateByProgram(): Promise<
  Record<string, string>
> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('workout_program_id, performed_at')
    .order('performed_at', { ascending: false })

  if (error) throw error

  const lastByProgram: Record<string, string> = {}
  for (const row of data ?? []) {
    const programId = row.workout_program_id as string
    if (lastByProgram[programId]) continue
    lastByProgram[programId] = toDateKey(new Date(row.performed_at))
  }

  return lastByProgram
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
      cardio_type,
      duration_minutes,
      program_exercises ( name, exercise_kind ),
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
    const exercise = oneRelation<{
      name: string
      exercise_kind: ExerciseKind
    }>(row.program_exercises)
    const program = oneRelation<{ name: string }>(row.workout_programs)
    const sets = ((row.exercise_log_sets as ExerciseLogSet[] | null) ?? [])
      .slice()
      .sort((a, b) => a.set_number - b.set_number)

    return {
      id: row.id,
      performed_at: row.performed_at,
      program_exercise_id: row.program_exercise_id,
      workout_program_id: row.workout_program_id,
      exercise_name: exercise?.name ?? 'Exercise',
      exercise_kind: exercise?.exercise_kind ?? 'strength',
      program_name: program?.name ?? 'Workout',
      cardio_type: row.cardio_type,
      duration_minutes: row.duration_minutes,
      sets,
    }
  })
}

function oneRelation<T>(value: unknown): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null
  return value as T
}
