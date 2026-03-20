import supabase from './supabaseClient'
import type { Account } from '../models/Account'

export async function getAccounts() {
  try {
    const { data, error } = await supabase.from('accounts').select('*')
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getAccountById(id: string) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createAccount(account: Partial<Account>) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .insert(account)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateAccount(id: string, account: Partial<Account>) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .update(account)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteAccount(id: string) {
  try {
    const { data, error } = await supabase.from('accounts').delete().eq('id', id)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getAccountsByUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
