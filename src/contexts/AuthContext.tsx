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
    console.log('🔍 Checking user type for:', userId)
    try {
      // Check admin table first
      const { data: admin, error: adminError } = await supabase
        .from('admin')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (adminError) {
        console.error('❌ Admin check error:', adminError)
        // Don't clear userType on network errors, keep previous value
        return
      }

      if (admin) {
        console.log('✅ User is admin')
        setUserType('admin')
        return
      }

      // Check students table
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (studentError) {
        console.error('❌ Student check error:', studentError)
        // Don't clear userType on network errors, keep previous value
        return
      }

      if (student) {
        console.log('✅ User is student')
        setUserType('student')
        return
      }

      // Only clear userType if we successfully checked both tables and found no match
      console.log('❌ User not found in admin or student tables, clearing userType')
      setUserType(null)
    } catch (err) {
      console.error('❌ User type check error:', err)
      // Don't clear userType on exceptions, keep previous value
    }
  }

  // Handle session change and role restoration
  const handleSessionChange = async (session: Session | null) => {
    console.log('🔄 Session change detected:', session ? 'User logged in' : 'User logged out')
    const currentUser = session?.user ?? null
    console.log('👤 Current user:', currentUser?.id || 'None')

    setUser(currentUser)
    if (currentUser) {
      console.log('🔍 Checking role for logged in user')
      await checkUserType(currentUser.id)
    } else {
      console.log('🚪 User logged out, clearing userType')
      setUserType(null)
    }
    setLoading(false)
  }

  // Single useEffect for session restoration and auth state changes
  useEffect(() => {
    let mounted = true
    const restoreSession = async () => {
      setLoading(true)
      // Make refresh behave like signout - clear session and sign out from Supabase
      console.log('🔄 Page refreshed - signing out user')
      console.log('🚨 emergencySignOut()')
      setUser(null)
      setUserType(null)
      await supabase.auth.signOut()
      setLoading(false)
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

  useEffect(() => {
    console.log('🎭 userType changed to:', userType)
  }, [userType])

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
