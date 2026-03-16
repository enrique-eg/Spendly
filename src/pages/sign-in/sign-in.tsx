import { useState } from "react"
import "../../components/auth/auth.css"
import { login, register } from "../../services/authService"
import Swal from "sweetalert2"

export default function SignInPage(){

  const [mode,setMode] = useState<"login" | "register">("login")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [confirmPassword,setConfirmPassword] = useState("")
  const [name,setName] = useState("")

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  // LOGIN
  async function handleLogin(e: React.FormEvent){
    e.preventDefault()

    const { error } = await login(email,password)
    Swal.fire({
      icon: error ? "error" : "success",
      title: error ? "Login failed" : "Login successful",
      text: error ? error.message : "Welcome back!"
    })
  }

  // REGISTER
  
async function handleRegister(e: React.FormEvent){
  e.preventDefault()

  if (password !== confirmPassword) {
    Swal.fire({
      icon: "error",
      title: "Passwords do not match"
    })
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
      title:"Weak password",
      text:"Password must contain at least 8 characters, one uppercase letter, one number and one special character."
    })
    return
  }


  if (!email || !password || !name) {
    Swal.fire({
      icon: "warning",
      title: "Missing fields",
      text: "Please complete all fields"
    })
    return
  }

  const { data, error } = await register(email,password,name)

  console.log("REGISTER:", data, error)

  if(error){

    let message = error.message

    if(message.includes("User already registered")){
      message = "This email is already registered"
    }

    Swal.fire({
      icon: "error",
      title: "Registration error",
      text: message
    })

    return
  }

  Swal.fire({
    icon: "success",
    title: "Registration successful",
    text: "Verify your email to log in"
  })

  setEmail("")
  setPassword("")
  setConfirmPassword("")
  setName("")
}

  return(
    <div className="auth-container">

      <div className={`auth-card ${mode === "register" ? "register-mode" : ""}`}>

        {/* FORMULARIO */}

        <div className="auth-form-container">

          {mode === "login" ? (

            <form className="auth-form" onSubmit={handleLogin}>

              <h1>Sign In</h1>

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
              />

              <button type="submit">SIGN IN</button>

            </form>

          ) : (

            <form className="auth-form" onSubmit={handleRegister}>

              <h1>Create Account</h1>

              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e)=>setName(e.target.value)}
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
              />
                {password && (
                  <div className="password-rules">

                    <p className={passwordChecks.length ? "valid" : "invalid"}>
                      • At least 8 characters
                    </p>

                    <p className={passwordChecks.uppercase ? "valid" : "invalid"}>
                      • One uppercase letter
                    </p>

                    <p className={passwordChecks.number ? "valid" : "invalid"}>
                      • One number
                    </p>

                    <p className={passwordChecks.special ? "valid" : "invalid"}>
                      • One special character
                    </p>

                  </div>
                )}

                <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e)=>setConfirmPassword(e.target.value)}
              />

              <button type="submit">SIGN UP</button>

            </form>

          )}

        </div>


        {/* PANEL DERECHO */}

        <div className="auth-panel">

          {mode === "login" ? (

            <>
              <h2>Welcome Back!</h2>
              <p>Sign in to continue using Finova</p>

              <button   onClick={()=>{
                setMode("register")
                setPassword("")
                setConfirmPassword("")
              }}>
                SIGN UP
              </button>
            </>

          ) : (

            <>
              <h2>Hello Friend!</h2>
              <p>Create an account to start managing finances</p>

              <button   onClick={()=>{
                setMode("login")
                setPassword("")
                setConfirmPassword("")
              }}>
                SIGN IN
              </button>
            </>

          )}

        </div>

      </div>

    </div>
  )
}


