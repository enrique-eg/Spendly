import supabase from './supabaseClient'
import type { SavingGoal } from '../models/SavingGoal'

export async function getGoals() {
  try {
    const { data, error } = await supabase.from('saving_goals').select('*')
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getGoalById(id: string) {
  try {
    const { data, error } = await supabase
      .from('saving_goals')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createGoal(goal: Partial<SavingGoal>) {
  try {
    const { data, error } = await supabase
      .from('saving_goals')
      .insert(goal)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateGoal(id: string, goal: Partial<SavingGoal>) {
  try {
    const { data, error } = await supabase
      .from('saving_goals')
      .update(goal)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteGoal(id: string) {
  try {
    const { data, error } = await supabase.from('saving_goals').delete().eq('id', id)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
