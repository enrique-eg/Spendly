import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import SettingsSidebar from '../../components/settings-sidebar/SettingsSidebar'
import { getAccountsByUser } from '../../services/accountsService'
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../../services/budgetsService'
import { getTransactionsByAccountInRange } from '../../services/transactionsService'
import type { Budget } from '../../models/Budget'
import './budgets.css'

function BudgetsPageInner(){
  const { user } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data: accData } = await getAccountsByUser(user.id)
      const { data: bData } = await getBudgets()
      setAccounts(accData || [])
      if (bData) setBudgets((bData as Budget[]).filter(b => b.user_id === user.id && b.period === 'monthly'))
      else setBudgets([])
      setLoading(false)
    }
    load()
  }, [user])

  const getSpentForAccount = async (accountId: string) => {
    try {
      const today = new Date()
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const end = new Date(today.getFullYear(), today.getMonth()+1, 0).toISOString().split('T')[0]
      const { data: txs, error } = await getTransactionsByAccountInRange(accountId, start, end)
      if (error) { console.error('Error fetching txs in range', error); return 0 }
      const spent = (txs || []).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
      return spent
    } catch (err) {
      console.error('getSpentForAccount error', err)
      return 0
    }
  }

  const handleSaveLimit = async (accountId: string, amount: number) => {
    if (!user) return
    if (!isFinite(amount) || amount <= 0) {
      alert('Por favor introduce un importe válido mayor que 0')
      return
    }
    // check existing
    const existing = budgets.find(b => b.account_id === accountId)
    const payload: Partial<Budget> = {
      user_id: user.id,
      account_id: accountId,
      limit_amount: amount,
      currency: 'USD',
      period: 'monthly'
    }
    // Ensure DB non-nullable dates are set for new budgets: start_date = first day of current month
    if (!existing) {
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      payload.start_date = startDate
    }
    try {
      if (existing) {
        const { data, error } = await updateBudget(existing.id, payload)
        if (error) { const msg = (error as any)?.message || JSON.stringify(error); alert('Error updating budget: ' + msg); console.error(error); return }
        setBudgets(budgets.map(b => b.id === existing.id ? (data as Budget) : b))
      } else {
        const { data, error } = await createBudget(payload)
        if (error) { const msg = (error as any)?.message || JSON.stringify(error); alert('Error creating budget: ' + msg); console.error(error); return }
        setBudgets([data as Budget, ...budgets])
      }
    } catch (err) {
      console.error('handleSaveLimit error', err)
      alert('Error guardando límite: ' + ((err as any)?.message || String(err)))
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Eliminar límite?')) return
    const { error } = await deleteBudget(id)
    if (error) { alert('Error eliminando'); console.error(error); return }
    setBudgets(budgets.filter(b => b.id !== id))
  }

  return (
    <>
      <header className="home-header">
        <div className="header-left">
          <div className="logo-circle"><span className="material-symbols-outlined">pie_chart</span></div>
          <div>
            <h1>Budgets</h1>
            <div className="header-sub">Monthly spending limits per account</div>
          </div>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)} aria-label="Open settings">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <div className="budgets-page">
        <main className="budgets-main">
          {loading && <p>Cargando...</p>}
          {!loading && accounts.length === 0 && <p>No tienes cuentas</p>}

          <div className="budgets-list">
            {accounts.map(a => {
              const b = budgets.find(x => x.account_id === a.id)
              return (
                <AccountBudgetCard
                  key={a.id}
                  account={a}
                  budget={b}
                  getSpent={() => getSpentForAccount(a.id)}
                  onSave={(amt: number) => handleSaveLimit(a.id, amt)}
                  onRemove={() => b && handleRemove(b.id)}
                />
              )
            })}
          </div>
        </main>

        <SettingsSidebar 
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          userId={user?.id || ''}
          defaultCurrency={''}
          onDefaultCurrencyChange={() => {}}
        />
      </div>
    </>
  )
}

function AccountBudgetCard({ account, budget, getSpent, onSave, onRemove }: any) {
  const [limit, setLimit] = useState<string>(budget?.limit_amount ? String(budget.limit_amount) : '')
  const [spent, setSpent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const s = await getSpent()
      if (mounted) setSpent(Number(s) || 0)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [getSpent])

  const numericLimit = Number(budget?.limit_amount ?? limit) || 0
  const pct = numericLimit > 0 ? Math.min(100, Math.round((spent / numericLimit) * 100)) : 0
  const fillClass = pct < 34 ? 'fill-green' : (pct < 67 ? 'fill-yellow' : 'fill-red')

  return (
    <div className="budget-card">
      <div className="budget-left">
        <div className="budget-avatar">{(account.name||'A').charAt(0).toUpperCase()}</div>
      </div>
      <div className="budget-body">
        <div className="budget-top">
          <div>
            <div className="budget-name">{account.name}</div>
            <div className="budget-meta">Account</div>
          </div>

          <div className="budget-values-block">
            <div className="small-label">Spent this month</div>
            <div className="budget-values">${spent.toFixed(2)}</div>
            <div className="small-label">Monthly limit</div>
            <div className="budget-values">${numericLimit.toFixed(2)}</div>
          </div>
        </div>

        <div className="progress-wrap">
          <div className="progress-bar"><div className={`progress-fill ${fillClass}`} style={{ width: pct + '%' }} /></div>
          <div className="progress-label">Progress: {pct}%</div>
        </div>

        <div className="budget-actions-row">
          <input type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Monthly limit (USD)" aria-label="Monthly limit" />
          <div className="actions-row">
            <button className="submit-btn" onClick={() => {
              const amt = parseFloat(limit || '0')
              onSave(amt)
            }}>Save limit</button>
            {budget && <button className="submit-btn danger" onClick={onRemove}>Remove limit</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

class BudgetsErrorBoundary extends React.Component<any, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }
  componentDidCatch(error: any, info: any) {
    console.error('BudgetsErrorBoundary caught error', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem', color: 'var(--text-primary, #fff)' }}>
          <h2>Algo fue mal en Budgets</h2>
          <pre style={{ color: '#f88' }}>{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function BudgetsPage(){
  return (
    <BudgetsErrorBoundary>
      <BudgetsPageInner />
    </BudgetsErrorBoundary>
  )
}

