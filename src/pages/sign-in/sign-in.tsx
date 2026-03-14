import { useState } from "react"
import "../../components/auth/auth.css"
import { login, register } from "../../services/authService"

export default function SignInPage(){

  const [mode,setMode] = useState<"login" | "register">("login")

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [name,setName] = useState("")

  // LOGIN
  async function handleLogin(e: React.FormEvent){
    e.preventDefault()

    const { error } = await login(email,password)

    if(error){
      alert(error.message)
      return
    }

    console.log("login correcto")
  }

  // REGISTER
  async function handleRegister(e: React.FormEvent){
    e.preventDefault()

    const { error } = await register(email,password,name)

    if(error){
      alert(error.message)
      return
    }

    console.log("usuario creado")
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

              <button onClick={()=>setMode("register")}>
                SIGN UP
              </button>
            </>

          ) : (

            <>
              <h2>Hello Friend!</h2>
              <p>Create an account to start managing finances</p>

              <button onClick={()=>setMode("login")}>
                SIGN IN
              </button>
            </>

          )}

        </div>

      </div>

    </div>
  )
}