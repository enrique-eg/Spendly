import supabase from './supabaseClient'

export async function getCurrencies() {
  try {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
