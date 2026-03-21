import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import SettingsSidebar from '../../components/settings-sidebar/SettingsSidebar'
import type { SavingGoal } from '../../models/SavingGoal'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../../services/goalsService'
import { getAccountsByUser } from '../../services/accountsService'
import './goals.css'

export default function GoalsPage(){
  const { user } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [goals, setGoals] = useState<SavingGoal[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', target_amount: '', currency: 'USD', account_id: '', deadline: '' })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data } = await getGoals()
      const { data: accData } = await getAccountsByUser(user.id)
      if (data) {
        setGoals((data as SavingGoal[]).filter(g => g.user_id === user.id))
      } else {
        setGoals([])
      }
      if (accData) setAccounts(accData)
      setLoading(false)
    }
    load()
  }, [user])

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({ name: '', target_amount: '', currency: 'USD', account_id: accounts.length>0?accounts[0].id:'', deadline: '' })
    setShowModal(true)
  }

  const handleEdit = (g: SavingGoal) => {
    setEditingId(g.id)
    setFormData({
      name: g.name,
      target_amount: String(g.target_amount),
      currency: g.currency || 'USD',
      account_id: g.account_id || '',
      deadline: g.deadline || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
      const parseDeadlineToDate = (input: string | null | undefined) => {
      if (!input) return null
      const trimmed = input.trim()
      // Try ISO parse first
      const iso = Date.parse(trimmed)
      if (!isNaN(iso)) return new Date(iso).toISOString().split('T')[0]

      // Match formats like "Dec 2024" or "December 2024"
      const m = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/)
      if (m) {
        const monthName = m[1]
        const year = parseInt(m[2], 10)
        const monthIndex = new Date(Date.parse(monthName + ' 1, 2000')).getMonth()
        if (!isNaN(monthIndex)) {
          return new Date(year, monthIndex, 1).toISOString().split('T')[0]
        }
      }

      // Match numeric month/year like 12/2024 or 2024-12 or month picker format 2024-12
      const mmSlash = trimmed.match(/^(\d{1,2})[\/](\d{4})$/)
      if (mmSlash) {
        const mmn = parseInt(mmSlash[1], 10)
        const yy = parseInt(mmSlash[2], 10)
        if (mmn >= 1 && mmn <= 12) {
          return new Date(yy, mmn - 1, 1).toISOString().split('T')[0]
        }
      }
      const ymd = trimmed.match(/^(\d{4})-(\d{2})$/)
      if (ymd) {
        const yy = parseInt(ymd[1], 10)
        const mmn = parseInt(ymd[2], 10)
        if (mmn >= 1 && mmn <= 12) {
          return new Date(yy, mmn - 1, 1).toISOString().split('T')[0]
        }
      }

      return null
    }

    const payload: Partial<SavingGoal> = {
      user_id: user.id,
      name: formData.name,
      target_amount: parseFloat(formData.target_amount || '0'),
      currency: formData.currency,
      account_id: formData.account_id || null,
      deadline: parseDeadlineToDate(formData.deadline) // send YYYY-MM-DD or null
    }

    if (editingId) {
      const { data, error } = await updateGoal(editingId, payload)
      if (error) {
        console.error('updateGoal error', error)
        alert('Error updating goal: ' + (error.message || JSON.stringify(error)))
        return
      }
      setGoals(goals.map(g => g.id === editingId ? (data as SavingGoal) : g))
      setShowModal(false)
    } else {
      const { data, error } = await createGoal(payload)
      if (error) {
        console.error('createGoal error', error)
        alert('Error creating goal: ' + (error.message || JSON.stringify(error)))
        return
      }
      setGoals([data as SavingGoal, ...goals])
      setShowModal(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar meta?')) return
    const { error } = await deleteGoal(id)
    if (error) { console.error('deleteGoal error', error); alert('Error deleting: ' + (error.message || JSON.stringify(error))); return }
    setGoals(goals.filter(g => g.id !== id))
  }

  const totalSaved = goals.reduce((sum, g) => sum + 0, 0)

  const formatDeadlineForDisplay = (dl?: string | null) => {
    if (!dl) return '—'
    // Accept values like YYYY-MM-DD or YYYY-MM
    const d = dl.length === 7 ? new Date(dl + '-01') : new Date(dl)
    if (isNaN(d.getTime())) return dl
    // English short month + year, e.g. "Dec 2024"
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <>
      <header className="home-header">
        <div className="header-left">
          <div className="logo-circle">
            <span className="material-symbols-outlined">savings</span>
          </div>
          <h1>Saving Goals</h1>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <div className="goals-page">
        <header className="goals-header">
          <div className="balance-card">
            <div className="card-header-top">
              <span className="balance-label">Total Saved</span>
            </div>
            <div className="balance-amount">${totalSaved.toFixed(2)}</div>
            <div className="small-note">$0 added this month</div>
          </div>
        </header>

        <main className="goals-main">
          {loading && <p>Cargando...</p>}
          {!loading && goals.length === 0 && <p className="empty">No goals yet</p>}

          <div className="goals-list">
            {goals.map(g => (
              <div key={g.id} className="goal-card">
                <div className="goal-left">
                  <div className="goal-avatar">{(g.name || 'G').charAt(0).toUpperCase()}</div>
                </div>
                <div className="goal-body">
                  <div className="goal-top">
                    <div className="goal-name">{g.name}</div>
                    <div className="goal-target">${g.target_amount.toFixed(2)}</div>
                  </div>
                  <div className="goal-meta">Target: {g.deadline ? formatDeadlineForDisplay(g.deadline) : '—'}</div>
                </div>
                <div className="goal-actions">
                  <button className="action-btn edit" onClick={() => handleEdit(g)}><span className="material-symbols-outlined">edit</span></button>
                  <button className="action-btn delete" onClick={() => handleDelete(g.id)}><span className="material-symbols-outlined">delete</span></button>
                </div>
              </div>
            ))}
          </div>

        </main>

        <button className="fab goals-fab" onClick={handleOpenCreate}><span className="material-symbols-outlined">add</span></button>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Goal' : 'New Goal'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Target amount</label>
                  <input type="number" step="0.01" value={formData.target_amount} onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Deadline</label>
                  <input type="month" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Account (optional)</label>
                  <select value={formData.account_id} onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}>
                    <option value="">Select an account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="submit-btn">{editingId ? 'Save' : 'Create'}</button>
                  <button type="button" className="submit-btn" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
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
