import "./premium.css"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import supabase from "../../services/supabaseClient"
import { useState, useEffect } from "react"
import Swal from "sweetalert2"

export default function Subscription(){

  const navigate = useNavigate()
  const { user } = useAuth()

  const [selected, setSelected] = useState("monthly")
  const [profile, setProfile] = useState<any>(null)

  // 🔥 Cargar perfil
  useEffect(()=>{
    if(!user) return

    const fetchProfile = async ()=>{
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(data)
    }

    fetchProfile()
  },[user])

  // 🔥 comprobar premium
  const isPremium = profile?.premium_until 
    && new Date(profile.premium_until) > new Date()

  async function handlePlan(days:number, type:string){

    if(isPremium){
      Swal.fire("Already Premium 🎉", "You already have an active subscription", "info")
      return
    }

    const result = await Swal.fire({
      title: `Confirm ${type} plan?`,
      text: "This will upgrade your account",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, continue"
    })

    if(!result.isConfirmed) return
    if(!user) return

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    await supabase
      .from("profiles")
      .update({ 
        premium_until: futureDate.toISOString(),
        subscription_type: type // 🔥 NUEVO
      })
      .eq("id", user.id)

    Swal.fire("Success 🚀", "Subscription activated", "success")

    navigate("/home")
  }

  return(
    <div className="sub-container">

      <h1>Choose your plan</h1>

      <div className="plans">

        {/* FREE */}
        <div 
          className={`plan ${selected === "free" ? "active" : ""}`}
          onClick={()=>setSelected("free")}
        >
          <h3>Free</h3>
          <h2>$0</h2>
          <p>Basic features</p>

          <ul>
            <li>Basic expense tracking</li>
            <li>Up to 3 budgets</li>
            <li>Manual data input</li>
          </ul>

          <button onClick={(e)=>{
            e.stopPropagation()
            navigate("/home")
          }}>
            Stay Free
          </button>
        </div>

        {/* MONTHLY */}
        <div 
          className={`plan featured ${selected === "monthly" ? "active" : ""}`}
          onClick={()=>setSelected("monthly")}
        >
          <h3>Monthly</h3>
          <h2>$15.99</h2>
          <p className="popular">🔥 Most popular</p>

          <ul>
            <li>Unlimited budgets & categories</li>
            <li>AI spending insights</li>
            <li>Advanced analytics dashboard</li>
            <li>Priority data sync</li>
          </ul>

          <button onClick={(e)=>{
            e.stopPropagation()
            handlePlan(30,"monthly")
          }}>
            Get Monthly
          </button>
        </div>

        {/* YEARLY */}
        <div 
          className={`plan ${selected === "yearly" ? "active" : ""}`}
          onClick={()=>setSelected("yearly")}
        >
          <h3>Yearly</h3>
          <h2>$99.99</h2>
          <p>Best value</p>

          <ul>
            <li>Everything in Monthly</li>
            <li>Full AI financial assistant</li>
            <li>Smart predictions & trends</li>
            <li>Premium support 24/7</li>
          </ul>

          <button onClick={(e)=>{
            e.stopPropagation()
            handlePlan(365,"yearly")
          }}>
            Get Yearly
          </button>
        </div>

      </div>

    </div>
  )
}