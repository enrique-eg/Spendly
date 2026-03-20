import supabase from './supabaseClient'

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateUserProfile(userId: string, updates: { default_currency?: string }) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
