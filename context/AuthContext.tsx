import { createContext, useContext, useEffect, useState } from "react"
import supabase from "../services/supabaseClient"
import type { User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {

    // Obtener sesión actual al cargar la app
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    // Escuchar cambios de autenticación
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    // Limpiar listener al desmontar
    return () => {
      listener.subscription.unsubscribe()
    }

  }, [])

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}