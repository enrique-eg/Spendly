import supabase from './supabaseClient'
import { Budget } from '../models/Budget'

export async function getBudgets() {
  try {
    const { data, error } = await supabase.from<Budget>('budgets').select('*')
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getBudgetById(id: string) {
  try {
    const { data, error } = await supabase
      .from<Budget>('budgets')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createBudget(budget: Partial<Budget>) {
  try {
    const { data, error } = await supabase
      .from<Budget>('budgets')
      .insert(budget)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateBudget(id: string, budget: Partial<Budget>) {
  try {
    const { data, error } = await supabase
      .from<Budget>('budgets')
      .update(budget)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteBudget(id: string) {
  try {
    const { data, error } = await supabase.from<Budget>('budgets').delete().eq('id', id)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
