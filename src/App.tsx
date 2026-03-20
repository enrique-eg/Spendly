import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import SignInPage from "./pages/sign-in/sign-in"
import HomePage from "./pages/home-page/home-page"
import { AuthProvider, useAuth } from "./context/AuthContext"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/sign-in" />
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
          <Route path="/sign-in" element={<AuthRoute><SignInPage /></AuthRoute>} />
          <Route path="/" element={<AuthRoute><SignInPage /></AuthRoute>} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App