export interface Budget {
  id: string
  user_id: string
  account_id?: string | null
  category_id?: string | null
  limit_amount: number
  currency: string
  period: 'weekly' | 'monthly' | 'yearly'
  start_date?: string | null
  end_date?: string | null
}
