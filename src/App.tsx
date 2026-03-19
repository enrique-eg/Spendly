import { BrowserRouter, Routes, Route } from "react-router-dom"
import SignIn from "./pages/sign-in/sign-in"
import SignUp from "./pages/sign-up/sign-up"
import { AuthProvider } from "./context/AuthContext"

function App() {
  return (
    <AuthProvider>

      <BrowserRouter>
        <Routes>

          <Route path="/" element={<SignIn />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />

        </Routes>
      </BrowserRouter>

    </AuthProvider>
  )
}

export default App