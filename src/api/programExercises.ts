import { supabase } from '../utils/supabase'

export type ProgramExercise = {
  id: string
  workout_program_id: string
  name: string
  sort_order: number
}

export async function getProgramExercises(
  workoutProgramId: string,
): Promise<ProgramExercise[]> {
  const { data, error } = await supabase
    .from('program_exercises')
    .select('id, workout_program_id, name, sort_order')
    .eq('workout_program_id', workoutProgramId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}
