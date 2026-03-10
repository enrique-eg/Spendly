export interface Category {
  id: string
  user_id?: string | null
  name: string
  type: 'income' | 'expense'
  created_at?: string
}
