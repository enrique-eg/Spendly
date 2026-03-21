export interface Subscription {
  id: string
  user_id: string
  account_id?: string | null
  category_id?: string | null
  name: string
  amount: number
  currency: string
  billing_day?: number | null
  is_active: boolean
}
