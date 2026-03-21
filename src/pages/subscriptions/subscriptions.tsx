import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import SettingsSidebar from '../../components/settings-sidebar/SettingsSidebar'
import type { Subscription } from '../../models/Subscription'
import { getSubscriptions, createSubscription, updateSubscription, deleteSubscription } from '../../services/subscriptionsService'
import { getTransactionsByAccount, createTransaction } from '../../services/transactionsService'
import type { Transaction } from '../../models/Transaction'
import { getAccountsByUser } from '../../services/accountsService'
import './subscriptions.css'

export default function SubscriptionsPage(){
  const { user } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', amount: '', currency: 'USD', billing_day: '', account_id: '', is_active: true })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data } = await getSubscriptions()
      const { data: accData } = await getAccountsByUser(user.id)
      if (data) {
        setSubscriptions((data as Subscription[]).filter(s => s.user_id === user.id))
      } else {
        setSubscriptions([])
      }
      if (accData) setAccounts(accData)
      setLoading(false)

      // After loading subscriptions, check for due charges and create transactions if needed
          ;(async function processDueCharges() {
        try {
          const today = new Date()
          

          // helper: get first day of month for a Date
          const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
          const addOneMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 1)

          for (const s of (data as Subscription[]).filter(ss => ss.user_id === user.id && ss.is_active)) {
            if (!s.billing_day || !s.account_id) continue
            const day = Number(s.billing_day)
            if (!day) continue

            // determine earliest month to consider: subscription creation month
            const createdAt = s.created_at ? new Date(s.created_at) : null
            const startMonth = createdAt ? monthStart(createdAt) : monthStart(today)

            // fetch existing transactions for this account once
            const { data: txs, error: txErr } = await getTransactionsByAccount(s.account_id)
            if (txErr) { console.error('Error fetching transactions for account', s.account_id, txErr); continue }

            // iterate month-by-month from startMonth up to current month
            for (let m = startMonth; m <= monthStart(today); m = addOneMonth(m)) {
              // compute billing day for month m
              const year = m.getFullYear()
              const monthIndex = m.getMonth()
              const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate()
              const billDay = Math.min(day, lastDayOfMonth)
              const chargeDate = new Date(year, monthIndex, billDay)

              // per-subscription/month guard to avoid duplicate creation across runs
              const subMonthKey = `subs_charged_${s.id}_${year}-${monthIndex+1}`
              if (sessionStorage.getItem(subMonthKey)) {
                continue
              }

              // debug log: candidate chargeDate and subscription info
              // do not create charges for future dates
              if (chargeDate > today) {
                continue
              }

              // do not create charges for months before subscription was created
              if (createdAt && chargeDate < createdAt) {
                continue
              }

              // check if a matching transaction already exists (by description marker)
              const matchingTx = (txs || []).find((t: any) => {
                const desc = String(t.description || '').trim()
                if (desc.includes(`subscription:${s.id}`)) return true
                if (desc === (s.name || '').trim()) return true
                const created = t.transaction_date || t.created_at
                if (!created) return false
                const d = new Date(created)
                // require same year, month AND day (billing day) for a match, plus same amount
                return d.getFullYear() === year && d.getMonth() === monthIndex && d.getDate() === billDay && Number(t.amount) === Number(s.amount)
              })
              if (matchingTx) {
                continue
              }

              // create transaction as expense dated at chargeDate
              const txPayload: Partial<Transaction> = {
                user_id: user.id,
                account_id: s.account_id,
                type: 'expense',
                amount: s.amount,
                currency: s.currency || defaultCurrency,
                description: `${s.name} subscription:${s.id}`,
                transaction_date: chargeDate.toISOString()
              }
              const { error: createErr } = await createTransaction(txPayload)
              if (createErr) {
                console.error('Error creating subscription transaction for', s.id, createErr)
              } else {
                try { sessionStorage.setItem(subMonthKey, '1') } catch (e) {}
              }
            }
          }
          // done processing subscriptions
        } catch (err) {
          console.error('processDueCharges error', err)
        }
      })()
    }
    load()
  }, [user])

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({ name: '', amount: '', currency: 'USD', billing_day: '', account_id: accounts.length>0?accounts[0].id:'', is_active: true })
    setShowModal(true)
  }

  const handleEdit = (sub: Subscription) => {
    setEditingId(sub.id)
    setFormData({
      name: sub.name,
      amount: String(sub.amount),
      currency: sub.currency,
      billing_day: sub.billing_day ? String(sub.billing_day) : '',
      account_id: sub.account_id || '',
      is_active: !!sub.is_active
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const payload: Partial<Subscription> = {
      user_id: user.id,
      name: formData.name,
      amount: parseFloat(formData.amount || '0'),
      currency: formData.currency,
      billing_day: formData.billing_day ? parseInt(formData.billing_day) : null,
      account_id: formData.account_id || null,
      is_active: !!formData.is_active
    }

    if (editingId) {
      const { data, error } = await updateSubscription(editingId, payload)
      if (error) {
        alert('Error actualizando suscripción')
        return
      }
      setSubscriptions(subscriptions.map(s => s.id === editingId ? (data as Subscription) : s))
      setShowModal(false)
    } else {
      const { data, error } = await createSubscription(payload)
      if (error) {
        alert('Error creando suscripción')
        return
      }
      setSubscriptions([data as Subscription, ...subscriptions])
      setShowModal(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar suscripción?')) return
    const { error } = await deleteSubscription(id)
    if (error) {
      alert('Error eliminando')
      return
    }
    setSubscriptions(subscriptions.filter(s => s.id !== id))
  }

  const totalMonthly = subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0)
  const activeCount = subscriptions.filter(s => s.is_active).length

  const getNextChargeMonth = (billingDay: number | string | null | undefined) => {
    if (!billingDay) return '-'
    const day = Number(billingDay)
    if (!day || day < 1) return '-'
    const today = new Date()
    let year = today.getFullYear()
    let month = today.getMonth()

    const makeCandidate = (y: number, m: number) => {
      const lastDay = new Date(y, m + 1, 0).getDate()
      const d = Math.min(day, lastDay)
      return new Date(y, m, d)
    }

    let candidate = makeCandidate(year, month)
    if (candidate <= today) {
      month += 1
      if (month > 11) { month = 0; year += 1 }
      candidate = makeCandidate(year, month)
    }

    const monthName = candidate.toLocaleString('en-US', { month: 'long' })
    return monthName.charAt(0).toUpperCase() + monthName.slice(1)
  }

  return (
    <>
      <header className="home-header">
        <div className="header-left">
          <div className="logo-circle">
            <span className="material-symbols-outlined">wallet</span>
          </div>
          <h1>Spendly</h1>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <header className="subs-header">
        <div className="subs-stats-grid">
          <div className="balance-card monthly-card">
            <div className="card-header-top">
              <span className="balance-label">Subscriptions</span>
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div className="balance-amount">${totalMonthly.toFixed(2)}</div>
          </div>

          <div className="active-card stat-card">
            <div className="stat-label">ACTIVE SUBS</div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-note">Stable</div>
          </div>
        </div>
      </header>

      <div className="subscriptions-page">
        <main className="subs-main">
        {loading && <p>Cargando...</p>}
        {!loading && subscriptions.length === 0 && <p className="empty">No hay suscripciones</p>}

        <div className="subs-list">
          {subscriptions.map(s => (
            <div key={s.id} className="sub-card">
              <div className="sub-left">
                  <div className="sub-avatar">{(s.name || 'S').charAt(0).toUpperCase()}</div>
                </div>
                <div className="sub-body">
                  <div className="sub-meta-left">
                    <div className="sub-name">{s.name}</div>
                    <div className="sub-meta">Account: {accounts.find(a => a.id === s.account_id)?.name || '-'} • {s.billing_day ? `${s.billing_day} ${getNextChargeMonth(s.billing_day)}` : '-'}</div>
                  </div>
                  <div className="sub-amount">${s.amount.toFixed(2)}</div>
                </div>
              <div className="sub-actions">
                <button className="action-btn edit" onClick={() => handleEdit(s)}><span className="material-symbols-outlined">edit</span></button>
                <button className="action-btn delete" onClick={() => handleDelete(s.id)}><span className="material-symbols-outlined">delete</span></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button className="fab subs-fab" onClick={handleOpenCreate}><span className="material-symbols-outlined">add</span></button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Suscripción' : 'Nueva Suscripción'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Importe</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Día de facturación</label>
                <input type="number" min="1" max="31" value={formData.billing_day} onChange={(e) => setFormData({ ...formData, billing_day: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Cuenta (opcional)</label>
                <select value={formData.account_id} onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}>
                  <option value="">Selecciona una cuenta</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="submit-btn">{editingId ? 'Guardar' : 'Crear'}</button>
                <button type="button" className="submit-btn" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <SettingsSidebar 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={user?.id || ''}
        defaultCurrency={defaultCurrency}
        onDefaultCurrencyChange={setDefaultCurrency}
      />
    </div>
    </>
  )
}