import supabase from './supabaseClient'
import { Account } from '../models/Account'

export async function getAccounts() {
  try {
    const { data, error } = await supabase.from<Account, Account>('accounts').select('*')
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getAccountById(id: string) {
  try {
    const { data, error } = await supabase
      .from<Account, Account>('accounts')
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
      .from<Account, Account>('accounts')
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
      .from<Account, Account>('accounts')
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
    const { data, error } = await supabase.from<Account, Account>('accounts').delete().eq('id', id)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
