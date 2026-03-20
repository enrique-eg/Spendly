import { useEffect, useState } from "react"
import "./personal-profile.css"
import userIcon from "../../assets/user.png"
import { useAuth } from "../../context/AuthContext"
import supabase from "../../services/supabaseClient"

export default function Profile(){

  const { user } = useAuth()

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
    const fileName = `${user.id}/${user.id}.${fileExt}` // ✅ carpeta = uid

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

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id)

    if (updateError) {
      console.error(updateError)
      return
    }

    setImage(publicUrl)
  }




  return(
    <div className="profile-container">

      {/* HEADER */}
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
            src={image || profile?.avatar_url || userIcon} 
          />

          <span className="verified">✔</span>

        </label>

        <h3>{profile?.username || "Juan Pérez"}</h3>
        <p>{user?.email || "email@example.com"}</p>

      </div>

      {}
      <div className="premium-card">
        <h4>⭐ Upgrade to Premium Plan</h4>
        <p>
          Get exclusive insights, unlimited budget categories,
          and advanced AI-powered forecasting tools.
        </p>
        <button>Upgrade Now</button>
      </div>

      {}
      <div className="settings">

        <p className="section-title">SECURITY & PRIVACY</p>

        <div className="setting-item">
          <span>🔒 Change Password</span>
          <span>›</span>
        </div>

        <div className="setting-item">
          <span>🧬 Biometric Login</span>
          <div className="toggle"></div>
        </div>

        <div className="setting-item">
          <span>🔔 Notification Settings</span>
          <span>›</span>
        </div>

      </div>

      {/* LOGOUT */}
      <button className="logout">Log Out</button>

    </div>
  )
}