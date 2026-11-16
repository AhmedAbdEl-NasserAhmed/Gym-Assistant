import { startTransition, useState } from 'react'
import { SignInForm } from '../components/SignInForm'
import { SignUpForm } from '../components/SignUpForm'
import './LoginPage.css'

type AuthView = 'signin' | 'signup'

export function LoginPage() {
  const [view, setView] = useState<AuthView>('signin')

  function showSignIn() {
    startTransition(() => setView('signin'))
  }

  function showSignUp() {
    startTransition(() => setView('signup'))
  }

  return (
    <main className="login">
      <div className="login__atmosphere" aria-hidden="true" />
      {view === 'signin' ? (
        <SignInForm onSwitchToSignUp={showSignUp} />
      ) : (
        <SignUpForm onSwitchToSignIn={showSignIn} />
      )}
    </main>
  )
}
