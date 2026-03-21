export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id?: string | null
  type: 'income' | 'expense' | 'transfer'
  amount: number
  currency: string
  exchange_rate?: number | null
  amount_converted?: number | null
  from_account_id?: string | null
  to_account_id?: string | null
  description?: string | null
  transaction_date?: string
  created_at?: string
}
