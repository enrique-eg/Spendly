import { supabase } from './supabaseClient';

export const getExchangeRate = async (fromCurrency: string, toCurrency: string) => {
  if (fromCurrency === toCurrency) {
    return { data: { rate: 1 }, error: null };
  }

  const { data, error } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .single();

  return { data, error };
};
