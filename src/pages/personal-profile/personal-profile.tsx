import { useEffect, useState } from "react"
import "./personal-profile.css"
import userIcon from "../../assets/user.png"
import lockIcon from "../../assets/padlock.png"
import bellIcon from "../../assets/notification-bell.png"
import premiumIcon from "../../assets/premium-quality.png"
import cardIcon from "../../assets/credit-card.png"
import bankIcon from "../../assets/bank.png"
import BankConnectModal, { BANK_COLORS } from "../../components/bankConnectModal/BankConnectModal"
import Swal from "sweetalert2"
import { useAuth } from "../../context/AuthContext"
import supabase from "../../services/supabaseClient"
import { useNavigate } from "react-router-dom"
import { formatDateOnly } from "../../utils/dateFormatter"

export default function Profile(){

  const { user } = useAuth()
  const navigate = useNavigate()

  const [image, setImage] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [showCards, setShowCards] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)

  const [cards, setCards] = useState([
    { id: 1, type: "Visa", last4: "1234", active: true },
    { id: 2, type: "Mastercard", last4: "5678", active: false }
  ])

  const [accounts, setAccounts] = useState<any[]>([])
  const [showBankModal, setShowBankModal] = useState(false)
  

  useEffect(() => {
    if(!user) return

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setProfile(data)
    }

    fetchProfile()
  }, [user])

  // Fetch bank accounts from Supabase
  useEffect(() => {
    if (!user) return
    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "bank")
      if (!error && data) setAccounts(data)
    }
    fetchAccounts()
  }, [user])

  const isPremium = profile?.premium_until 
    && new Date(profile.premium_until) > new Date()

  const expiryDate = profile?.premium_until
    ? formatDateOnly(profile.premium_until)
    : null

  async function handleCancelSubscription(){

    const confirm = await Swal.fire({
      title: "Cancel subscription?",
      text: "You will lose premium features",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel"
    })

    if (!confirm.isConfirmed || !user) return

    await supabase
      .from("profiles")
      .update({
        premium_until: null,
        subscription_type: null
      })
      .eq("id", user.id)

    Swal.fire("Cancelled", "You are now on free plan", "success")

    window.location.reload()
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${user.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error(uploadError)
      return
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    const publicUrl = data.publicUrl

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id)

    setImage(publicUrl)
  }

  function toggleCard(id: number){
    setCards(prev =>
      prev.map(c => c.id === id ? { ...c, active: !c.active } : c)
    )
  }

  async function toggleAccount(id: string) {
    const account = accounts.find(a => a.id === id)
    if (!account) return

    const newState = !account.is_active

    setAccounts(prev =>
      prev.map(a => a.id === id ? { ...a, is_active: newState } : a)
    )

    const { error } = await supabase
      .from("accounts")
      .update({ is_active: newState })
      .eq("id", id)

    if (error) {
      console.error(error)
      setAccounts(prev =>
        prev.map(a => a.id === id ? { ...a, is_active: !newState } : a)
      )
    }
  }

  async function deleteAccount(id: string) {
    const confirm = await Swal.fire({
      title: "Delete account?",
      text: "This will also delete all transactions linked to this account",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete"
    })

    if (!confirm.isConfirmed) return

    await supabase
      .from("transactions")
      .delete()
      .eq("account_id", id)

    await supabase
      .from("accounts")
      .delete()
      .eq("id", id)

    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  async function handleLogout(){
    const result = await Swal.fire({
      title: "Log out?",
      text: "You will need to sign in again",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, log out"
    })

    if (!result.isConfirmed) return

    await supabase.auth.signOut()
    navigate("/sign-in")
  }

  return(
    <div className="profile-container">

      <div className="profile-header">
        <h2>Account</h2>
        <span className="gear">⚙️</span>
      </div>

      <div className="profile-user">

        <label className="avatar">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />

          <img 
            className="avatar-img"
            src={image || profile?.avatar_url || userIcon} 
          />
        </label>

        <h3>{profile?.username || "Usuario"}</h3>
        <p>{user?.email}</p>

      </div>

      {/* 🔥 PREMIUM DINÁMICO */}
      <div className="premium-card">

        {!isPremium ? (
          <>
            <h4 className="premium-title">
              <img src={premiumIcon} className="icon" />
              Upgrade to Premium Plan
            </h4>

            <p>
              Get exclusive insights, unlimited budget categories,
              and advanced AI-powered forecasting tools.
            </p>

            <button onClick={()=>navigate("/subscription")}>
              Upgrade Now
            </button>
          </>
        ) : (
          <>
            <h4 className="premium-title">
              <img src={premiumIcon} className="icon" />
              Premium Active 💎
            </h4>

            <p>
              Plan: <strong>{profile?.subscription_type?.toUpperCase()}</strong>
            </p>

            <p>
              Expires on: <strong>{expiryDate}</strong>
            </p>

            <button onClick={()=>navigate("/subscription")}>
              Change Subscription
            </button>

            <button 
              className="cancel-btn"
              onClick={handleCancelSubscription}
            >
              Cancel Subscription
            </button>
          </>
        )}

      </div>

      {/* SETTINGS */}
      <div className="settings">

        <p className="section-title">SECURITY & PRIVACY</p>

        <div className="setting-item">
          <span className="setting-left">
            <img src={lockIcon} className="icon" />
            Change Password
          </span>
          <span>›</span>
        </div>

        <div className="setting-item clickable" onClick={()=>setShowCards(prev => !prev)}>
          <span className="setting-left">
            <img src={cardIcon} className="icon" />
            Cards
          </span>
          <span>{showCards ? "˄" : "›"}</span>
        </div>

        {showCards && (
          <div className="dropdown">
            {cards.map(card => (
              <div key={card.id} className="dropdown-item">
                <span>{card.type} ****{card.last4}</span>

                <div 
                  className={`toggle ${card.active ? "active" : ""}`}
                  onClick={(e)=>{
                    e.stopPropagation()
                    toggleCard(card.id)
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div className="setting-item clickable" onClick={() => setShowAccounts(prev => !prev)}>
          <span className="setting-left">
            <img src={bankIcon} className="icon" />
            Bank Accounts
          </span>
          <span>{showAccounts ? "˄" : "›"}</span>
        </div>

        {showAccounts && (
          <div className="dropdown">
            {accounts.map(acc => (
              <div key={acc.id} className="dropdown-item">
                <div className="account-card-row">
                  <div
                    className="bank-logo-dot"
                    style={{ background: BANK_COLORS[acc.bank_name] || "#22c55e" }}
                  >
                    {acc.bank_name?.slice(0, 4).toUpperCase()}
                  </div>
                  <div className="account-info">
                    <span className="account-iban">{acc.account_number || "ES** **** ****"}</span>
                    <small className="account-owner">{acc.name}</small>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    className="delete-account-btn"
                    onClick={(e) => { e.stopPropagation(); deleteAccount(acc.id) }}
                  >
                    <span className="material-symbols-outlined">delete</span>

                  </button>
                  <div
                    className={`toggle ${acc.is_active ? "active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleAccount(acc.id) }}
                  />
                </div>
              </div>
            ))}

            <button className="add-account-btn" onClick={() => setShowBankModal(true)}>
              + Add bank account
            </button>
          </div>
        )}

        {showBankModal && (
          <BankConnectModal
            userId={user!.id}
            onClose={() => setShowBankModal(false)}
            onConnected={(newAccount) => setAccounts(prev => [...prev, newAccount])}
          />
        )}

        <div className="setting-item">
          <span className="setting-left">
            <img src={bellIcon} className="icon" />
            Notification Settings
          </span>
          <span>›</span>
        </div>

      </div>

      <button className="logout" onClick={handleLogout}>
        Log Out
      </button>

    </div>
  )
}