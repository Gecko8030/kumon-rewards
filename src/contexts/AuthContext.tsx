import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  userType: 'student' | 'admin' | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUserType: () => Promise<void>
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

  // Check user type (admin first, then student)
  const checkUserType = async (userId: string) => {
    try {
      // Check admin table first
      const { data: admin } = await supabase
        .from('admin')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      if (admin) {
        setUserType('admin')
        return
      }
      // Check students table
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      if (student) {
        setUserType('student')
        return
      }
      setUserType(null)
    } catch (err) {
      setUserType(null)
    }
  }

  // Handle session change and role restoration
  const handleSessionChange = async (session: Session | null) => {
    const currentUser = session?.user ?? null
    setUser(currentUser)
    if (currentUser) {
      await checkUserType(currentUser.id)
    } else {
      setUserType(null)
    }
    setLoading(false)
  }

  // Single useEffect for session restoration and auth state changes
  useEffect(() => {
    let mounted = true
    const restoreSession = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) {
        await handleSessionChange(session)
      }
    }
    restoreSession()
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        await handleSessionChange(session)
      }
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    setUser(null)
    setUserType(null)
    setLoading(false)
    await supabase.auth.signOut()
  }

  const refreshUserType = async () => {
    if (user) {
      await checkUserType(user.id)
    }
  }

  useEffect(() => {
    (window as any).refreshUserType = refreshUserType
    return () => {
      delete (window as any).refreshUserType
    }
  }, [user])

  return (
    <AuthContext.Provider value={{
      user,
      userType,
      loading,
      signIn,
      signOut,
      refreshUserType
    }}>
      {children}
    </AuthContext.Provider>
  )
}
