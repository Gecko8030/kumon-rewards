import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  userType: 'student' | 'admin' | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userType, setUserType] = useState<'student' | 'admin' | null>(null)
  const [loading, setLoading] = useState(true)

  const checkUserType = async (userId: string) => {
    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (student) {
        setUserType('student')
        return
      }

      const { data: admin } = await supabase
        .from('admin')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (admin) {
        setUserType('admin')
        return
      }

      setUserType(null)
    } catch (err) {
      console.error('Failed to determine user type:', err)
      setUserType(null)
    }
  }

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        await checkUserType(currentUser.id)
      }

      setLoading(false)
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        await checkUserType(currentUser.id)
      } else {
        setUserType(null)
      }

      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Don't update loading here — it's handled in auth state listener
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // Don't set loading or clear user — listener handles it
  }

  return (
    <AuthContext.Provider value={{ user, userType, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
