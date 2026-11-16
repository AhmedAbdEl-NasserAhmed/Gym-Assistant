import type { Session, Subscription } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase'

export type AuthCredentials = {
  email: string
  password: string
}

export type SignUpResult = {
  session: Session | null
  needsEmailConfirmation: boolean
}

export async function signInWithEmail({ email, password }: AuthCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) throw error
  return data
}

export async function signUpWithEmail({
  email,
  password,
}: AuthCredentials): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  })

  if (error) throw error

  return {
    session: data.session,
    needsEmailConfirmation: !data.session,
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
): Subscription {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })

  return subscription
}
