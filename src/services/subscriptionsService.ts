import supabase from './supabaseClient'
import type { Subscription } from '../models/Subscription'

export async function getSubscriptions() {
  try {
    const { data, error } = await supabase.from('subscriptions').select('*')
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getSubscriptionById(id: string) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createSubscription(subscription: Partial<Subscription>) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateSubscription(id: string, subscription: Partial<Subscription>) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(subscription)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteSubscription(id: string) {
  try {
    const { data, error } = await supabase.from('subscriptions').delete().eq('id', id)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
