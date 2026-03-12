import { BrowserRouter, Routes, Route } from "react-router-dom"
import SignInPage from "./pages/sign-in/sign-in"

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<SignInPage />} />

        <Route path="/sign-in" element={<SignInPage />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App