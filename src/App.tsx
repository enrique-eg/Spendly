import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import SignInPage from "./pages/sign-in/sign-in"
import SignUp from "./pages/sign-up/sign-up"
import HomePage from "./pages/home-page/home-page"
import { AuthProvider, useAuth } from "./context/AuthContext"
import BottomNav from './components/bottomNav/BottomNav'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}<BottomNav/></> : <Navigate to="/sign-in" />
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return !user ? <>{children}</> : <Navigate to="/home" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* LOGIN */}
          <Route 
            path="/sign-in" 
            element={
              <AuthRoute>
                <SignInPage />
              </AuthRoute>
            } 
          />

          {/* ROOT */}
          <Route 
            path="/" 
            element={
              <AuthRoute>
                <SignInPage />
              </AuthRoute>
            } 
          />

          {/* REGISTER NUEVO */}
          <Route 
            path="/sign-up" 
            element={
              <AuthRoute>
                <SignUp />
              </AuthRoute>
            } 
          />

          {/* HOME (equipo) */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App