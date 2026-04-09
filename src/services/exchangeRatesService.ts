import supabase from './supabaseClient';

export const getExchangeRate = async (fromCurrency: string, toCurrency: string = 'EUR') => {
  if (fromCurrency === toCurrency) {
    return { data: { rate: 1 }, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .single();

    if (error) {
      console.error('Error fetching exchange rate:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching exchange rate:', error);
    return { data: null, error };
  }
};

export const convertToEUR = async (amount: number, fromCurrency: string): Promise<number> => {
  if (fromCurrency === 'EUR') {
    return amount;
  }

  const { data, error } = await getExchangeRate(fromCurrency, 'EUR');
  
  if (error || !data?.rate) {
    console.warn(`Could not convert ${fromCurrency} to EUR, storing as-is`);
    return amount;
  }

  return amount * data.rate;
};

export const convertFromEUR = async (amount: number, toCurrency: string): Promise<number> => {
  if (toCurrency === 'EUR') {
    return amount;
  }

  const { data, error } = await getExchangeRate(toCurrency, 'EUR');
  
  if (error || !data?.rate) {
    console.warn(`Could not convert EUR to ${toCurrency}, showing EUR amount`);
    return amount;
  }

  // Inverse of the rate: if 1 USD = 0.92 EUR, then 1 EUR = 1/0.92 USD
  return amount / data.rate;
};
