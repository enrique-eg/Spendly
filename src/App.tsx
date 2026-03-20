import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import SignIn from "./pages/sign-in/sign-in"
import SignUp from "./pages/sign-up/sign-up"
import Profile from "./pages/personal-profile/personal-profile"
import { AuthProvider, useAuth } from "./context/AuthContext"

function ProtectedRoute({ children }: any) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/sign-in" />
  }

  return children
}

function RedirectIfAuth({ children }: any) {
  const { user } = useAuth()
  return user ? <Navigate to="/profile" /> : children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route 
            path="/" 
            element={
              <RedirectIfAuth>
                <SignIn />
              </RedirectIfAuth>
            } 
          />

          <Route 
            path="/sign-in" 
            element={
              <RedirectIfAuth>
                <SignIn />
              </RedirectIfAuth>
            } 
          />
          <Route 
            path="/sign-up" 
            element={
              <RedirectIfAuth>
                <SignUp />
              </RedirectIfAuth>
            } 
          />


          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App