import { Link } from 'react-router-dom'

export default function GoalsPage(){
  return (
    <div style={{padding: '1rem'}}>
      <h2>Goals</h2>
      <p>Esta página está en desarrollo. Pendiente de implementar.</p>
      <p><Link to="/home">Volver al inicio</Link></p>
    </div>
  )
}
