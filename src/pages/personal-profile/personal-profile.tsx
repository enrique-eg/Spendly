import { useEffect, useState } from "react"
import "./personal-profile.css"
import userIcon from "../../assets/user.png"
import lockIcon from "../../assets/padlock.png"
import bellIcon from "../../assets/notification-bell.png"
import premiumIcon from "../../assets/premium-quality.png"
import cardIcon from "../../assets/credit-card.png"
import bankIcon from "../../assets/bank.png"
import Swal from "sweetalert2"

import { useAuth } from "../../context/AuthContext"
import supabase from "../../services/supabaseClient"
import { useNavigate } from "react-router-dom"

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

  const [accounts, setAccounts] = useState([
    { id: 1, iban: "ES91 **** 1234", owner: "Juan Pérez", bank: "Santander", active: true },
    { id: 2, iban: "ES12 **** 5678", owner: "Juan Pérez", bank: "BBVA", active: false }
  ])


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

  function toggleAccount(id: number){
    setAccounts(prev =>
      prev.map(a => a.id === id ? { ...a, active: !a.active } : a)
    )
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

      {/* PREMIUM */}
      <div className="premium-card">
        <h4 className="premium-title">
          <img src={premiumIcon} className="icon" />
          Upgrade to Premium Plan
        </h4>

        <p>
          Get exclusive insights, unlimited budget categories,
          and advanced AI-powered forecasting tools.
        </p>

        <button>Upgrade Now</button>
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

        <div className="setting-item clickable" onClick={()=>setShowAccounts(prev => !prev)}>
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
                <span>
                  {acc.iban}
                  <br/>
                  <small>{acc.owner} - {acc.bank}</small>
                </span>

                <div 
                  className={`toggle ${acc.active ? "active" : ""}`}
                  onClick={(e)=>{
                    e.stopPropagation()
                    toggleAccount(acc.id)
                  }}
                />
              </div>
            ))}
          </div>
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