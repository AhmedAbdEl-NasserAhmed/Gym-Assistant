import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange } from './api/auth'
import type { WorkoutProgram } from './api/workoutPrograms'
import { CalendarPage } from './pages/CalendarPage'
import { DayPage } from './pages/DayPage'
import { LoginPage } from './pages/LoginPage'
import { ProgramExercisesPage } from './pages/ProgramExercisesPage'
import { WorkoutSelectPage } from './pages/WorkoutSelectPage'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [logging, setLogging] = useState(false)
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
      if (!nextSession) {
        setSelectedDate(null)
        setLogging(false)
        setSelectedProgram(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  function returnToDay() {
    setLogging(false)
    setSelectedProgram(null)
  }

  if (!ready) {
    return <div className="app-boot" aria-busy="true" />
  }

  if (!session) {
    return <LoginPage />
  }

  if (!selectedDate) {
    return (
      <CalendarPage
        onSelectDate={(dateKey) => {
          setSelectedDate(dateKey)
          setLogging(false)
          setSelectedProgram(null)
        }}
      />
    )
  }

  if (!logging) {
    return (
      <DayPage
        dateKey={selectedDate}
        onBack={() => {
          setSelectedDate(null)
          setSelectedProgram(null)
        }}
        onAddWorkout={(program) => {
          setLogging(true)
          setSelectedProgram(program ?? null)
        }}
        onChangeWorkout={() => {
          setLogging(true)
          setSelectedProgram(null)
        }}
      />
    )
  }

  if (!selectedProgram) {
    return (
      <WorkoutSelectPage
        dateKey={selectedDate}
        onBack={returnToDay}
        onSelectProgram={setSelectedProgram}
      />
    )
  }

  return (
    <ProgramExercisesPage
      program={selectedProgram}
      dateKey={selectedDate}
      onBack={returnToDay}
    />
  )
}

export default App
