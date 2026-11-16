import { supabase } from '../utils/supabase'

export type WorkoutProgram = {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
}

export async function getWorkoutPrograms(): Promise<WorkoutProgram[]> {
  const { data, error } = await supabase
    .from('workout_programs')
    .select('id, slug, name, description, sort_order')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}
