import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange } from './api/auth'
import type { WorkoutProgram } from './api/workoutPrograms'
import { LoginPage } from './pages/LoginPage'
import { ProgramExercisesPage } from './pages/ProgramExercisesPage'
import { WorkoutSelectPage } from './pages/WorkoutSelectPage'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(
    null,
  )

  useEffect(() => {
    async function loadSession() {
      try {
        const currentSession = await getSession()
        setSession(currentSession)
      } catch {
        setSession(null)
      } finally {
        setReady(true)
      }
    }

    void loadSession()

    const subscription = onAuthStateChange((nextSession) => {
      setSession(nextSession)
      setReady(true)
      if (!nextSession) setSelectedProgram(null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (!ready) {
    return <div className="app-boot" aria-busy="true" />
  }

  if (!session) {
    return <LoginPage />
  }

  if (!selectedProgram) {
    return (
      <WorkoutSelectPage onSelectProgram={setSelectedProgram} />
    )
  }

  return (
    <ProgramExercisesPage
      program={selectedProgram}
      onBack={() => setSelectedProgram(null)}
    />
  )
}

export default App
