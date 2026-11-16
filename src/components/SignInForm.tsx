import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { signInWithEmail, type AuthCredentials } from '../api/auth'

type SignInFormProps = {
  onSwitchToSignUp: () => void
}

export function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthCredentials>({
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: AuthCredentials) {
    setError(null)
    try {
      await signInWithEmail(values)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.',
      )
    }
  }

  return (
    <>
      <header className="login__header">
        <p className="login__mark">Gym Assistant</p>
        <h1 className="login__title">Welcome back</h1>
        <p className="login__subtitle">
          Track workouts, plans, and progress in one place.
        </p>
      </header>

      <form
        className="login__form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <label className="login__field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? true : undefined}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email',
              },
            })}
          />
          {errors.email ? (
            <span className="login__field-error">{errors.email.message}</span>
          ) : null}
        </label>

        <label className="login__field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={errors.password ? true : undefined}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />
          {errors.password ? (
            <span className="login__field-error">{errors.password.message}</span>
          ) : null}
        </label>

        {error ? <p className="login__error" role="alert">{error}</p> : null}

        <button className="login__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="login__switch">
        New here?{' '}
        <button type="button" onClick={onSwitchToSignUp}>
          Create an account
        </button>
      </p>
    </>
  )
}
