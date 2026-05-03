import { useState } from "react"
import "./sign-in.css"
import { login } from "../../services/authService"
import Swal from "sweetalert2"
import { Link } from "react-router-dom"
import walletIcon from "../../assets/wallet.png"

export default function SignIn(){

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  async function handleLogin(e: React.FormEvent){
    e.preventDefault()

    const { error } = await login(email,password)

    Swal.fire({
      icon: error ? "error" : "success",
      title: error ? "Login failed" : "Welcome back!",
      text: error ? error.message : ""
    })
  }

  return(
    <div className="login-container">

      <div className="login-wrapper">

        {/* LOGO (mobile) */}
        <div className="logo-box mobile-logo">
          <img src={walletIcon} alt="logo" />
        </div>

        <form className="login-card" onSubmit={handleLogin}>

          {/* LOGO (desktop) */}
          <div className="logo-box desktop-logo">
            <img src={walletIcon} alt="logo" />
          </div>

          <h2>Welcome back</h2>
          <p>Enter your details to access your account</p>

          <label htmlFor="email">Email</label>
          <input id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />

          <span className="forgot-password">Forgot password?</span>

          <button type="submit">Sign In</button>

          <div className="divider"><span>or</span></div>

          <Link to="/sign-up" className="secondary-btn">
            Create Account
          </Link>

          <p className="legal">
            By continuing, you agree to Terms & Privacy Policy.
          </p>

        </form>

      </div>

    </div>
  )
}