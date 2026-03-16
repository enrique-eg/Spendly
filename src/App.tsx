import { BrowserRouter, Routes, Route } from "react-router-dom"
import SignInPage from "./pages/sign-in/sign-in"
import { AuthProvider } from "./context/AuthContext"

function App() {
  return (
    <AuthProvider>

      <BrowserRouter>
        <Routes>

          <Route path="/" element={<SignInPage />} />

          <Route path="/sign-in" element={<SignInPage />} />

        </Routes>
      </BrowserRouter>

    </AuthProvider>
  )
}

export default App