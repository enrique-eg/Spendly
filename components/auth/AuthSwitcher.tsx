import "./auth.css"

export default function AuthLayout({
  children,
  panel,
  mode
}: {
  children: React.ReactNode
  panel: React.ReactNode
  mode: "login" | "register"
}) {
  return (
    <div className="auth-container">

      <div className={`auth-card ${mode === "register" ? "register-mode" : ""}`}>

        <div className="auth-form-container">
          {children}
        </div>

        <div className="auth-panel">
          {panel}
        </div>

      </div>

    </div>
  )
}