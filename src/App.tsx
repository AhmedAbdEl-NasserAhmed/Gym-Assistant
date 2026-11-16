import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange, signOut } from './api/auth'
import { LoginPage } from './pages/LoginPage'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    getSession()
      .then((currentSession) => {
        if (!mounted) return
        setSession(currentSession)
        setReady(true)
      })
      .catch(() => {
        if (!mounted) return
        setSession(null)
        setReady(true)
      })

    const subscription = onAuthStateChange((nextSession) => {
      setSession(nextSession)
      setReady(true)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (!ready) {
    return <div className="app-boot" aria-busy="true" />
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <main className="app">
      <h1 className="brand">Gym Assistant</h1>
      <p className="tagline">Signed in as {session.user.email}</p>
      <button
        type="button"
        className="sign-out"
        onClick={() => {
          void signOut()
        }}
      >
        Sign out
      </button>
    </main>
  )
}

export default App
