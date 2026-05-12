import "./premium.css"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useState } from "react"
import Swal from "sweetalert2"

export default function Subscription(){

  const navigate = useNavigate()
  const { user } = useAuth()

  const [selected, setSelected] = useState("monthly")

  return(
    <div className="sub-container">

      <h1>Choose your plan</h1>

      <div className="plans">

        {/* FREE */}
        <div 
          className={`plan ${selected === "free" ? "active" : ""}`}
          onClick={()=>setSelected("free")}
        >
          <h2>Free</h2>
          <h3>$0</h3>
          <p>Basic features</p>

          <ul>
            <li>Limited budgets</li>
            <li>Basic tracking</li>
          </ul>

          <button onClick={(e)=>{
            e.stopPropagation()
            navigate("/home")
          }}>
            Stay Free
          </button>
        </div>

        {/* MONTHLY */}
        <div 
          className={`plan featured ${selected === "monthly" ? "active" : ""}`}
          onClick={()=>setSelected("monthly")}
        >
          <h2>Monthly</h2>
          <h3>$15.99</h3>
          <p className="popular">Most popular</p>

          <ul>
            <li>Unlimited budgets</li>
            <li>AI insights</li>
            <li>Analytics</li>
          </ul>

          <button onClick={(e)=>{
            e.stopPropagation()

            if(!user){
              Swal.fire("Error", "You must be logged in", "error")
              return
            }

            navigate("/payment", { 
              state: { days: 30, type: "monthly" } 
            })
          }}>
            Get Monthly
          </button>
        </div>

        {/* YEARLY */}
        <div 
          className={`plan ${selected === "yearly" ? "active" : ""}`}
          onClick={()=>setSelected("yearly")}
        >
          <h2>Yearly</h2>
          <h3>$99.99</h3>
          <p>Best value</p>

          <ul>
            <li>Everything included</li>
            <li>Priority support</li>
          </ul>

          <button onClick={(e)=>{
            e.stopPropagation()

            if(!user){
              Swal.fire("Error", "You must be logged in", "error")
              return
            }

            navigate("/payment", { 
              state: { days: 365, type: "yearly" } 
            })
          }}>
            Get Yearly
          </button>
        </div>

      </div>

    </div>
  )
}