import { Link } from 'react-router-dom'

export default function AIPage(){
  return (
    <div style={{padding: '1rem', color: 'var(--text-primary, #fff)'}}>
      <h2>AI</h2>
      <p>Herramientas de IA próximamente. Página placeholder.</p>
      <p><Link to="/home">Volver al inicio</Link></p>
    </div>
  )
}
