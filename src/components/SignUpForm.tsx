import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { signUpWithEmail, type AuthCredentials } from '../api/auth'

type SignUpFormProps = {
  onSwitchToSignIn: () => void
}

export function SignUpForm({ onSwitchToSignIn }: SignUpFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthCredentials>({
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: AuthCredentials) {
    setError(null)
    setInfo(null)
    try {
      const result = await signUpWithEmail(values)
      if (result.needsEmailConfirmation) {
        setInfo('Check your email to confirm your account, then sign in.')
        reset({ email: values.email, password: '' })
      }
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
        <h1 className="login__title">Create your account</h1>
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
            autoComplete="new-password"
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
        {info ? <p className="login__info" role="status">{info}</p> : null}

        <button className="login__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="login__switch">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToSignIn}>
          Sign in
        </button>
      </p>
    </>
  )
}
