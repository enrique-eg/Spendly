import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import supabase from './services/supabaseClient'

function App() {
  const [count, setCount] = useState(0)
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function checkDb() {
      try {
        // lightweight check: select 1 id from a small table
        const { data, error } = await supabase.from('profiles').select('id').limit(1)
        if (!mounted) return
        if (error) {
          // network error or server error
          setDbStatus('error')
          setDbError(error.message ?? String(error))
        } else {
          setDbStatus('connected')
          setDbError(null)
        }
      } catch (err: any) {
        if (!mounted) return
        setDbStatus('error')
        setDbError(err?.message ?? String(err))
      }
    }
    checkDb()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div style={{ marginBottom: 12 }}>
        {dbStatus === 'checking' && <span>Comprobando conexión a la base de datos…</span>}
        {dbStatus === 'connected' && <span style={{ color: 'green' }}>Conectado a la base de datos</span>}
        {dbStatus === 'error' && (
          <span style={{ color: 'red' }}>Error al conectar: {dbError}</span>
        )}
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
