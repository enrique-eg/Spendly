import { useState } from "react"
import supabase from "../../services/supabaseClient"
import "./BankConnectModal.css"

const MOCK_BANKS = [
  { id: "santander", label: "Santander", color: "#EC0000",
    mockData: {
      account_number: "ES91 **** **** 1234",
      name: "Enrique Espino González",
      balance: 3420.50,
      transactions: [
        { description: "Mercadona", amount: -54.30, transaction_date: "2026-04-10", type: "expense" },
        { description: "Nómina abril", amount: 2100.00, transaction_date: "2026-04-05", type: "income" },
        { description: "Netflix", amount: -15.99, transaction_date: "2026-04-03", type: "expense" },
        { description: "Recibo luz", amount: -72.00, transaction_date: "2026-04-01", type: "expense" },
      ]
    }
  },
  { id: "bbva", label: "BBVA", color: "#004481",
    mockData: {
      account_number: "ES12 **** **** 5678",
      name: "Raúl Núñez Torres",
      balance: 8105.20,
      transactions: [
        { description: "El Corte Inglés", amount: -120.00, transaction_date: "2026-04-10", type: "expense" },
        { description: "Transferencia recibida", amount: 500.00, transaction_date: "2026-04-08", type: "income" },
        { description: "Spotify", amount: -9.99, transaction_date: "2026-04-04", type: "expense" },
      ]
    }
  },
  { id: "ing", label: "ING Direct", color: "#FF6200",
    mockData: {
      account_number: "ES34 **** **** 9012",
      name: "Jesús Alberto Ortega Hernández",
      balance: 1250.00,
      transactions: [
        { description: "Amazon", amount: -29.99, transaction_date: "2026-04-09", type: "expense" },
        { description: "Nómina", amount: 2400.00, transaction_date: "2026-04-05", type: "income" },
      ]
    }
  },
  { id: "caixabank", label: "CaixaBank", color: "#007BC4",
    mockData: {
      account_number: "ES56 **** **** 3456",
      name: "Abel Romero Tavío",
      balance: 5230.10,
      transactions: [
        { description: "Gym", amount: -35.00, transaction_date: "2026-04-08", type: "expense" },
        { description: "Nómina", amount: 1800.00, transaction_date: "2026-04-05", type: "income" },
      ]
    }
  },
]

export const BANK_COLORS: Record<string, string> = {
  Santander: "#EC0000", BBVA: "#004481",
  "ING Direct": "#FF6200", CaixaBank: "#007BC4",
}

type Step = "select" | "login" | "loading" | "success"

interface Props {
  userId: string
  onClose: () => void
  onConnected: (account: any) => void
}

export default function BankConnectModal({ userId, onClose, onConnected }: Props) {
  const [step, setStep] = useState<Step>("select")
  const [selectedBank, setSelectedBank] = useState<typeof MOCK_BANKS[0] | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loadingText, setLoadingText] = useState("")
  const [ setImportedAccount] = useState<any>(null)

  async function handleConnect() {
    if (!username || !password || !selectedBank) return
    setStep("loading")

    const msgs = ["Connecting to your bank...", "Verifying credentials...", "Importing transactions..."]
    let i = 0
    setLoadingText(msgs[0])
    const iv = setInterval(() => { i++; if (i < msgs.length) setLoadingText(msgs[i]) }, 900)

    setTimeout(async () => {
      clearInterval(iv)
      const mock = selectedBank.mockData

      // Insertar en accounts
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .insert({
          user_id: userId,
          name: mock.name,
          bank_name: selectedBank.label,
          type: "bank",
          currency: "EUR",
          is_active: true,
          account_number: mock.account_number,
        })
        .select()
        .single()

      if (accountError || !accountData) {
        console.error(accountError)
        return
      }

      // Insertar transacciones
      const txs = mock.transactions.map(tx => ({
        user_id: userId,
        account_id: accountData.id,
        description: tx.description,
        amount: Math.abs(tx.amount),
        type: tx.type,
        currency: "EUR",
        transaction_date: tx.transaction_date,
      }))

      await supabase.from("transactions").insert(txs)

      setImportedAccount(accountData)
      onConnected(accountData)
      setStep("success")
    }, 3000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {step === "select" && (
          <>
            <p className="step-label">Step 1 of 3</p>
            <h3>Connect your bank</h3>
            <p className="modal-sub">Select your bank to get started</p>
            {MOCK_BANKS.map(bank => (
              <div key={bank.id} className="bank-option" onClick={() => { setSelectedBank(bank); setStep("login") }}>
                <div className="bank-logo-dot" style={{ background: bank.color }}>
                  {/* <img src={logoMap[bank.id]} /> cuando tengas los logos */}
                  {bank.label.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <p className="bank-option-name">{bank.label}</p>
                </div>
                <span className="modal-chevron">›</span>
              </div>
            ))}
            <button className="modal-btn-ghost" onClick={onClose}>Cancel</button>
          </>
        )}

        {step === "login" && (
          <>
            <p className="step-label">Step 2 of 3</p>
            <div className="modal-bank-header">
              <div className="bank-logo-dot" style={{ background: selectedBank?.color }}>
                {selectedBank?.label.slice(0, 3).toUpperCase()}
              </div>
              <h3>{selectedBank?.label}</h3>
            </div>
            <p className="modal-sub">Enter your online banking credentials</p>
            <label className="inp-label">Username / ID</label>
            <input className="modal-inp" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your banking username" />
            <label className="inp-label">Password</label>
            <input className="modal-inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            <p className="modal-notice">Your credentials are never stored. Used only to import your transactions.</p>
            <button className="modal-btn-green" onClick={handleConnect}>Connect</button>
            <button className="modal-btn-ghost" onClick={() => setStep("select")}>Back</button>
          </>
        )}

        {step === "loading" && (
          <div className="modal-center">
            <div className="spinner" />
            <p className="loading-text">{loadingText}</p>
            <p className="modal-sub">Please wait</p>
          </div>
        )}

        {step === "success" && (
          <div className="modal-center">
            <div className="success-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="loading-text">Account connected!</p>
            <p className="modal-sub">{selectedBank?.label} imported successfully</p>
            <button className="modal-btn-green" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}