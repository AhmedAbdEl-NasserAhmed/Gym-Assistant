import { supabase } from '../utils/supabase'

export type ExerciseKind = 'strength' | 'cardio'

export type ProgramExercise = {
  id: string
  workout_program_id: string
  name: string
  sort_order: number
  exercise_kind: ExerciseKind
}

export async function getProgramExercises(
  workoutProgramId: string,
): Promise<ProgramExercise[]> {
  const { data, error } = await supabase
    .from('program_exercises')
    .select('id, workout_program_id, name, sort_order, exercise_kind')
    .eq('workout_program_id', workoutProgramId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    exercise_kind: (row.exercise_kind as ExerciseKind) ?? 'strength',
  }))
}
