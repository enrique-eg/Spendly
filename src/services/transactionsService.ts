import supabase from './supabaseClient'
import { convertToEUR } from './exchangeRatesService'
import type { Transaction } from '../models/Transaction'

export async function getTransactionsByUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
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

export async function getTransactionsByAccountInRange(accountId: string, startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .eq('type', 'expense')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createTransaction(transaction: Partial<Transaction>) {
  try {
    // Convert amount to EUR for storage
    const amountConverted = transaction.currency && transaction.amount 
      ? await convertToEUR(transaction.amount, transaction.currency)
      : transaction.amount;

    const transactionWithConversion = {
      ...transaction,
      amount_converted: amountConverted
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionWithConversion)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateTransaction(id: string, transaction: Partial<Transaction>) {
  try {
    // Convert amount to EUR for storage
    const amountConverted = transaction.currency && transaction.amount 
      ? await convertToEUR(transaction.amount, transaction.currency)
      : transaction.amount_converted;

    const transactionWithConversion = {
      ...transaction,
      amount_converted: amountConverted
    };

    const { data, error } = await supabase
      .from('transactions')
      .update(transactionWithConversion)
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
