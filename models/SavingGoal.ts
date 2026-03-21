export interface SavingGoal {
  id: string
  user_id: string
  account_id?: string | null
  name: string
  target_amount: number
  currency: string
  deadline?: string | null
}
