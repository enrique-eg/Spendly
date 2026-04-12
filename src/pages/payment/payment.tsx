import "./payment.css"
import { useNavigate, useLocation } from "react-router-dom"
import { useState } from "react"
import Swal from "sweetalert2"
import supabase from "../../services/supabaseClient"
import { useAuth } from "../../context/AuthContext"

export default function Payment(){

  const navigate = useNavigate()
  const { user } = useAuth()
  const location = useLocation()

  const { days, type } = location.state || {}

  const [card, setCard] = useState("")
  const [cvv, setCvv] = useState("")
  const [name, setName] = useState("")

  function validate(){
    if(!card || !cvv || !name){
      Swal.fire("Error", "Fill all fields", "error")
      return false
    }

    const cardRegex = /^[0-9]{16}$/
    const cvvRegex = /^[0-9]{3}$/

    if(!cardRegex.test(card)){
      Swal.fire("Error", "Invalid card number", "error")
      return false
    }

    if(!cvvRegex.test(cvv)){
      Swal.fire("Error", "Invalid CVV", "error")
      return false
    }

    return true
  }

  async function handlePayment(){

    if(!validate()) return
    if(!user) return

    await Swal.fire({
      title: "Processing payment...",
      timer: 1500,
      didOpen: ()=>Swal.showLoading()
    })

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    // Actualizar perfil premium
    await supabase
      .from("profiles")
      .update({
        premium_until: futureDate.toISOString(),
        subscription_type: type
      })
      .eq("id", user.id)

    // Crear transacción del pago
    const amount = type === "monthly" ? 15.99 : 99.99

    const { data: accData } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: accData?.id || null,
        type: "expense",
        amount: amount,
        currency: "USD",
        description: `Spendly Premium - ${type === "monthly" ? "Monthly" : "Yearly"} plan`,
        transaction_date: new Date().toISOString(),
      })

    Swal.fire("Success", "Payment completed", "success")
    navigate("/home")
  }
  return(
    <div className="payment-container">

      <h2>Payment Details</h2>

      <input
        placeholder="Cardholder Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
      />

      <input
        placeholder="Card Number (16 digits)"
        value={card}
        onChange={(e)=>setCard(e.target.value)}
      />

      <input
        placeholder="CVV (3 digits)"
        value={cvv}
        onChange={(e)=>setCvv(e.target.value)}
      />

      <button onClick={handlePayment}>
        Pay Now 
      </button>

    </div>
  )
}