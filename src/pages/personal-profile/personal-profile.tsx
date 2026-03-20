import { useEffect, useState } from "react"
import "./personal-profile.css"
import userIcon from "../../assets/user.png"
import lockIcon from "../../assets/padlock.png"
import bellIcon from "../../assets/notification-bell.png"
import reloadIcon from "../../assets/reload.png"
import premiumIcon from "../../assets/premium-quality.png"

import { useAuth } from "../../context/AuthContext"
import supabase from "../../services/supabaseClient"
import { useNavigate } from "react-router-dom"

export default function Profile(){

  const { user } = useAuth()
  const navigate = useNavigate()

  const [image, setImage] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)

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

  async function handleLogout(){
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

          <span className="verified">✔</span>
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

        <div className="setting-item">
          <span className="setting-left">
            <img src={reloadIcon} className="icon" />
            Biometric Login
          </span>
          <div className="toggle"></div>
        </div>

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