import supabase from './supabaseClient'
import type { Transaction } from '../models/Transaction'

export async function getTransactions() {
  try {
    const { data, error } = await supabase.from('transactions').select('*')
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getTransactionsByAccount(accountId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createTransaction(transaction: Partial<Transaction>) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateTransaction(id: string, transaction: Partial<Transaction>) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(transaction)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteTransaction(id: string) {
  try {
    const { data, error } = await supabase.from('transactions').delete().eq('id', id)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
