import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import SettingsSidebar from '../../components/settings-sidebar/SettingsSidebar'
import { getAccountsByUser } from '../../services/accountsService'
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../../services/budgetsService'
import { getTransactionsByAccount } from '../../services/transactionsService'
import type { Budget } from '../../models/Budget'
import './budgets.css'

export default function BudgetsPage(){
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
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth()+1, 0)
    const { data: txs, error } = await getTransactionsByAccount(accountId)
    if (error) { console.error('Error fetching txs', error); return 0 }
    const spent = (txs || []).filter((t: any) => {
      if (t.type !== 'expense') return false
      const d = new Date(t.transaction_date || t.created_at)
      return d >= start && d <= end
    }).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
    return spent
  }

  const handleSaveLimit = async (accountId: string, amount: number) => {
    if (!user) return
    // check existing
    const existing = budgets.find(b => b.account_id === accountId)
    const payload: Partial<Budget> = {
      user_id: user.id,
      account_id: accountId,
      limit_amount: amount,
      currency: 'USD',
      period: 'monthly'
    }
    if (existing) {
      const { data, error } = await updateBudget(existing.id, payload)
      if (error) { alert('Error updating budget'); console.error(error); return }
      setBudgets(budgets.map(b => b.id === existing.id ? (data as Budget) : b))
    } else {
      const { data, error } = await createBudget(payload)
      if (error) { alert('Error creating budget'); console.error(error); return }
      setBudgets([data as Budget, ...budgets])
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
          <h1>Budgets</h1>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
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
                  onSave={(amt) => handleSaveLimit(a.id, amt)}
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
  const [limit, setLimit] = useState(budget?.limit_amount || 0)
  const [spent, setSpent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const s = await getSpent()
      if (mounted) setSpent(s)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [getSpent])

  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0

  return (
    <div className="budget-card">
      <div className="budget-left">
        <div className="budget-avatar">{(account.name||'A').charAt(0).toUpperCase()}</div>
      </div>
      <div className="budget-body">
        <div className="budget-top">
          <div className="budget-name">{account.name}</div>
          <div className="budget-values">${spent.toFixed(2)} / ${limit.toFixed(2)}</div>
        </div>

        <div className="progress-wrap">
          <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
          <div className="progress-label">{pct}%</div>
        </div>

        <div className="budget-actions-row">
          <input type="number" step="0.01" value={limit || ''} onChange={(e) => setLimit(parseFloat(e.target.value || '0'))} placeholder="Monthly limit" />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="submit-btn" onClick={() => onSave(limit)}>Save</button>
            {budget && <button className="submit-btn danger" onClick={onRemove}>Remove</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
import { Link } from 'react-router-dom'

export default function BudgetsPage(){
  return (
    <div style={{padding: '1rem', color: 'var(--text-primary, #fff)'}}>
      <h2>Budgets</h2>
      <p>Esta página está en desarrollo. Pendiente de implementar.</p>
      <p><Link to="/home">Volver al inicio</Link></p>
    </div>
  )
}
