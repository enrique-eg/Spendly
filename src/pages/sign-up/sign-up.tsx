import { useState } from "react"
import "./sign-up.css"
import { register } from "../../services/authService"
import Swal from "sweetalert2"
import { Link } from "react-router-dom"

export default function SignUp(){

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [confirmPassword,setConfirmPassword] = useState("")

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  async function handleRegister(e: React.FormEvent){
    e.preventDefault()

    if(password !== confirmPassword){
      Swal.fire({ icon:"error", title:"Passwords do not match" })
      return
    }

    if(
      !passwordChecks.length ||
      !passwordChecks.uppercase ||
      !passwordChecks.number ||
      !passwordChecks.special
    ){
      Swal.fire({
        icon:"error",
        title:"Weak password"
      })
      return
    }

    const { error } = await register(email,password,name)

    Swal.fire({
      icon: error ? "error" : "success",
      title: error ? "Error" : "Account created",
      text: error ? error.message : "Check your email"
    })
  }

  return(
    <div className="register-container">

      <form className="register-card" onSubmit={handleRegister}>

        <h2>Join Spendly</h2>
        <p>Start your journey to better financial health today.</p>

        <input type="text" placeholder="John Doe" value={name} onChange={(e)=>setName(e.target.value)} />
        <input type="email" placeholder="name@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />

        <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />

        {password && (
          <div className="password-rules">
            <p className={passwordChecks.length ? "valid" : "invalid"}>At least 8 characters</p>
            <p className={passwordChecks.uppercase ? "valid" : "invalid"}>One uppercase letter</p>
            <p className={passwordChecks.number ? "valid" : "invalid"}>One number</p>
            <p className={passwordChecks.special ? "valid" : "invalid"}>One special character</p>
          </div>
        )}

        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} />

        <button type="submit">Sign Up</button>

        <p className="login-link">
          Already have an account? <Link to="/sign-in">Log in</Link>
        </p>

      </form>

    </div>
  )
}