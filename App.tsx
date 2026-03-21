import { BrowserRouter, Routes, Route } from "react-router-dom"
import SignIn from "./pages/sign-in/sign-in"
import SignUp from "./pages/sign-up/sign-up"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App