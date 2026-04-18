import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import SettingsSidebar from '../../components/settings-sidebar/SettingsSidebar'
import { getAccountsByUser } from '../../services/accountsService'
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../../services/budgetsService'
import { getTransactionsByAccountInRange, getTransactionsByUser } from '../../services/transactionsService'
import { getCategories } from '../../services/categoriesService'
import type { Budget } from '../../models/Budget'
import './budgets.css'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#854F0B',
  Transport: '#185FA5',
  Entertainment: '#993C1D',
  Health: '#0F6E56',
  Housing: '#534AB7',
  Shopping: '#993556',
  Bills: '#3B6D11',
  Subscriptions: '#5F5E5A',
  Travel: '#0C447C',
  Education: '#633806',
  Other: '#444441',
}

function BudgetsPageInner(){
  const { user } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [newCategoryLimit, setNewCategoryLimit] = useState('')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data: accData } = await getAccountsByUser(user.id)
      const { data: bData } = await getBudgets()
      const { data: catData } = await getCategories()

      setAccounts(accData || [])
      setCategories((catData || []).filter((c: any) => c.type === 'expense'))

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
      if (error) { console.error(error); return 0 }
      return (txs || []).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
    } catch (err) {
      console.error(err)
      return 0
    }
  }

  const getSpentForCategory = async (categoryId: string) => {
    try {
      const today = new Date()
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth()+1, 0)
      const { data: txs } = await getTransactionsByUser(user!.id)
      return (txs || [])
        .filter((t: any) => {
          const d = new Date(t.transaction_date)
          return t.category_id === categoryId &&
            t.type === 'expense' &&
            d >= start &&
            d <= end
        })
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
    } catch (err) {
      console.error(err)
      return 0
    }
  }

  const handleSaveLimit = async (accountId: string, amount: number) => {
    if (!user) return
    if (!isFinite(amount) || amount <= 0) { alert('Introduce un importe válido mayor que 0'); return }
    const existing = budgets.find(b => b.account_id === accountId)
    const today = new Date()
    const payload: Partial<Budget> = {
      user_id: user.id,
      account_id: accountId,
      limit_amount: amount,
      currency: 'USD',
      period: 'monthly',
      ...(!existing && { start_date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0] })
    }
    try {
      if (existing) {
        const { data, error } = await updateBudget(existing.id, payload)
        if (error) { alert('Error updating: ' + (error as any)?.message); return }
        setBudgets(budgets.map(b => b.id === existing.id ? (data as Budget) : b))
      } else {
        const { data, error } = await createBudget(payload)
        if (error) { alert('Error creating: ' + (error as any)?.message); return }
        setBudgets([data as Budget, ...budgets])
      }
    } catch (err) {
      alert('Error: ' + ((err as any)?.message || String(err)))
    }
  }

  const handleSaveCategoryLimit = async (categoryId: string, amount: number) => {
    if (!user) return
    if (!isFinite(amount) || amount <= 0) { alert('Introduce un importe válido mayor que 0'); return }
    const existing = budgets.find(b => b.category_id === categoryId)
    const today = new Date()
    const payload: Partial<Budget> = {
      user_id: user.id,
      category_id: categoryId,
      limit_amount: amount,
      currency: 'USD',
      period: 'monthly',
      start_date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    }
    try {
      if (existing) {
        const { data, error } = await updateBudget(existing.id, payload)
        if (error) { alert('Error updating: ' + (error as any)?.message); return }
        setBudgets(budgets.map(b => b.id === existing.id ? (data as Budget) : b))
      } else {
        const { data, error } = await createBudget(payload)
        if (error) { alert('Error creating: ' + (error as any)?.message); return }
        setBudgets([data as Budget, ...budgets])
      }
    } catch (err) {
      alert('Error: ' + ((err as any)?.message || String(err)))
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Eliminar límite?')) return
    const { error } = await deleteBudget(id)
    if (error) { alert('Error eliminando'); return }
    setBudgets(budgets.filter(b => b.id !== id))
  }

  return (
    <>
      <header className="home-header">
        <div className="header-left">
          <div className="logo-circle"><span className="material-symbols-outlined">pie_chart</span></div>
          <div>
            <h1>Budgets</h1>
            <div className="header-sub">Monthly spending limits</div>
          </div>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)} aria-label="Open settings">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <div className="budgets-page">
        <main className="budgets-main" style={{ paddingBottom: '6rem' }}>
          {loading && <p>Cargando...</p>}

          {/* CUENTAS */}
          {!loading && accounts.length > 0 && (
            <>
              <p className="section-divider">By account</p>
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
            </>
          )}

          {/* CATEGORÍAS */}
          {!loading && (
            <>
              <p className="section-divider">Categories</p>

              <div className="budgets-list">
                {budgets
                  .filter(b => b.category_id)
                  .map(b => {
                    const cat = categories.find(c => c.id === b.category_id)
                    if (!cat) return null
                    return (
                      <CategoryBudgetCard
                        key={cat.id}
                        category={cat}
                        budget={b}
                        getSpent={() => getSpentForCategory(cat.id)}
                        onSave={(amt: number) => handleSaveCategoryLimit(cat.id, amt)}
                        onRemove={() => handleRemove(b.id)}
                      />
                    )
                  })}

                {budgets.filter(b => b.category_id).length === 0 && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>
                    No category budgets yet. Add one to start tracking.
                  </p>
                )}
              </div>
            </>
          )}
        </main>

        {/* BOTÓN FIJO ENCIMA DEL FOOTER */}
        {!loading && (
          <button className="add-category-btn" onClick={() => setShowAddCategory(true)}>
            + Add Category
          </button>
        )}

        {/* MODAL */}
        {showAddCategory && (
          <div className="modal-overlay" onClick={() => setShowAddCategory(false)}>
            <div className="add-category-modal" onClick={e => e.stopPropagation()}>
              <h3>Add category budget</h3>
              <p className="modal-sub-text">Select a category and set a monthly limit</p>

              <div className="cat-list">
                {categories
                  .filter(c => !budgets.find(b => b.category_id === c.id))
                  .map(cat => (
                    <div
                      key={cat.id}
                      className={`cat-option ${selectedCategoryId === cat.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCategoryId(cat.id)}
                    >
                      <div
                        className="budget-avatar"
                        style={{ background: CATEGORY_COLORS[cat.name] || '#534AB7', width: 36, height: 36, fontSize: 13 }}
                      >
                        {cat.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{cat.name}</span>
                    </div>
                  ))}
              </div>

              {selectedCategoryId && (
                <div className="cat-limit-row">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Monthly limit"
                    value={newCategoryLimit}
                    onChange={e => setNewCategoryLimit(e.target.value)}
                  />
                  <button className="submit-btn" onClick={async () => {
                    await handleSaveCategoryLimit(selectedCategoryId, parseFloat(newCategoryLimit))
                    setShowAddCategory(false)
                    setSelectedCategoryId('')
                    setNewCategoryLimit('')
                  }}>
                    Save
                  </button>
                </div>
              )}

              <button
                className="submit-btn danger"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setShowAddCategory(false)
                  setSelectedCategoryId('')
                  setNewCategoryLimit('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
  const [, setLoading] = useState(true)

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
          <input type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Monthly limit (USD)" />
          <div className="actions-row">
            <button className="submit-btn" onClick={() => onSave(parseFloat(limit || '0'))}>Save limit</button>
            {budget && <button className="submit-btn danger" onClick={onRemove}>Remove limit</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryBudgetCard({ category, budget, getSpent, onSave, onRemove }: any) {
  const [limit, setLimit] = useState<string>(budget?.limit_amount ? String(budget.limit_amount) : '')
  const [spent, setSpent] = useState(0)
  const [, setLoading] = useState(true)

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
  const avatarColor = CATEGORY_COLORS[category.name] || '#534AB7'

  return (
    <div className="budget-card">
      <div className="budget-left">
        <div className="budget-avatar" style={{ background: avatarColor }}>
          {(category.name || 'C').charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="budget-body">
        <div className="budget-top">
          <div>
            <div className="budget-name">{category.name}</div>
            <div className="budget-meta">Category</div>
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
          <input type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Monthly limit (USD)" />
          <div className="actions-row">
            <button className="submit-btn" onClick={() => onSave(parseFloat(limit || '0'))}>Save limit</button>
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