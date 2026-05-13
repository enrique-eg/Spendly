import supabase from './supabaseClient'
import type { Budget } from '../models/Budget'

export async function getBudgetSpent(categoryId: string, startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount_converted')
      .eq('category_id', categoryId)
      .eq('type', 'expense')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
    
    if (error) return { data: null, error }
    
    const totalSpent = data?.reduce((sum: number, tx: any) => sum + (tx.amount_converted || 0), 0) || 0
    return { data: totalSpent, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getBudgets() {
  try {
    const { data, error } = await supabase.from('budgets').select('*')
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getBudgetById(id: string) {
  try {
    const { data, error } = await supabase
      .from('budgets')
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
      .from('budgets')
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
      .from('budgets')
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
    const { data, error } = await supabase.from('budgets').delete().eq('id', id)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
