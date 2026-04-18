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

  const [name, setName] = useState("")
  const [card, setCard] = useState("")
  const [cvv, setCvv] = useState("")
  const [expiry, setExpiry] = useState("")

  function formatCard(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16)
    return digits.replace(/(.{4})/g, "$1 ").trim()
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6)
    if (digits.length <= 2) return digits
    return digits.slice(0, 2) + "/" + digits.slice(2)
  }

  function validate() {
    if (!name || !card || !cvv || !expiry) {
      Swal.fire("Error", "Please fill in all fields", "error")
      return false
    }

    const rawCard = card.replace(/\s/g, "")
    if (rawCard.length !== 16) {
      Swal.fire("Error", "Card number must be 16 digits", "error")
      return false
    }

    if (cvv.length !== 3) {
      Swal.fire("Error", "CVV must be 3 digits", "error")
      return false
    }

    const expiryParts = expiry.split("/")
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 4) {
      Swal.fire("Error", "Expiry date must be MM/YYYY", "error")
      return false
    }

    const month = parseInt(expiryParts[0])
    const year = parseInt(expiryParts[1])
    const now = new Date()

    if (month < 1 || month > 12) {
      Swal.fire("Error", "Invalid expiry month", "error")
      return false
    }

    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      Swal.fire("Error", "Your card has expired", "error")
      return false
    }

    return true
  }

  async function handlePayment() {
    if (!validate()) return
    if (!user) return

    await Swal.fire({
      title: "Processing payment...",
      timer: 1500,
      didOpen: () => Swal.showLoading()
    })

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    await supabase
      .from("profiles")
      .update({
        premium_until: futureDate.toISOString(),
        subscription_type: type
      })
      .eq("id", user.id)

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

  const amount = type === "monthly" ? "$15.99" : "$99.99"
  const planLabel = type === "monthly" ? "Monthly" : "Yearly"

  return (
    <>
      {/* HEADER */}
      <header className="home-header">
        <div className="header-left">
          <div className="logo-circle">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <h1>Payment Process</h1>
            <div className="header-sub">Complete your subscription</div>
          </div>
        </div>

        <button 
          className="settings-btn"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </header>

      <div className="payment-page">
        <div className="payment-card">

          {/* LEFT */}
          <div className="payment-left">
            <div>
              <h2>Checkout</h2>
              <p className="payment-sub">You're one step away...</p>
            </div>

            <div className="payment-steps">
              <div className="payment-step">
                <div className="step-num">1</div>
                <p>Fill in your card details to complete the payment</p>
              </div>
              <div className="payment-step">
                <div className="step-num">2</div>
                <p>We accept the following cards</p>
              </div>
              <div className="cards-row">
                <div className="card-badge visa">VISA</div>
                <div className="card-badge mc">MC</div>
                <div className="card-badge maestro">Maestro</div>
                <div className="card-badge amex">Amex</div>
              </div>
              <div className="payment-step">
                <div className="step-num">3</div>
                <p>We won't share your details with any third party</p>
              </div>
            </div>

            <div className="payment-support">
              <p>Need support?</p>
              <a href="mailto:support@spendly.com">Contact us</a>
            </div>
          </div>

          {/* RIGHT */}
          <div className="payment-right">
            <div className="plan-badge">
              <span className="plan-name">Spendly Premium · {planLabel}</span>
              <span className="plan-amount">{amount}</span>
            </div>

            <div className="field">
              <label>Name on card</label>
              <input
                placeholder="Enter cardholder's name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Card number</label>
              <input
                placeholder="XXXX XXXX XXXX XXXX"
                value={card}
                onChange={e => setCard(formatCard(e.target.value))}
                maxLength={19}
              />
            </div>

            <div className="row2">
              <div className="field">
                <label>CVV</label>
                <input
                  placeholder="XXX"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  maxLength={3}
                />
              </div>
              <div className="field">
                <label>Expiration date</label>
                <input
                  placeholder="MM/YYYY"
                  value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  maxLength={7}
                />
              </div>
            </div>

            <button className="btn-pay" onClick={handlePayment}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0d2818" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Continue payment
            </button>

            <button className="btn-back" onClick={() => navigate(-1)}>
              ← Go back
            </button>

            <div className="secure-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
              </svg>
              <span>Secured by 256-bit SSL encryption</span>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}