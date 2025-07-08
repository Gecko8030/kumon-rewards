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
  const [session, setSession] = useState<Session | null>(null)

  const checkUserType = async (userId: string) => {
    try {
      console.log('Checking user type for:', userId)
      // Check admin table first (as per your setup)
      const { data: admin, error: adminError } = await supabase
        .from('admin')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      
      if (adminError) {
        console.error('Error checking admin table:', adminError)
      } else {
        console.log('Admin table query result:', admin)
      }
      
      if (admin) {
        console.log('User is an admin')
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
        console.error('Error checking students table:', studentError)
      } else {
        console.log('Students table query result:', student)
      }
      
      if (student) {
        console.log('User is a student')
        setUserType('student')
        return
      }
      
      console.log('User type not found in either table')
      setUserType(null)
    } catch (err) {
      console.error('Failed to determine user type:', err)
      setUserType(null)
    }
    console.log('Finished user type check')
  }

  const handleSessionChange = async (session: Session | null) => {
    console.log('Handling session change:', session?.user?.email || 'no user')
    const currentUser = session?.user ?? null
    setUser(currentUser)
    setSession(session)
    
    if (currentUser) {
      console.log('User found, checking type...')
      await checkUserType(currentUser.id)
    } else {
      console.log('No user, clearing type')
      setUserType(null)
    }
    setLoading(false)
  }

  // Single useEffect for session management
  useEffect(() => {
    let mounted = true
    
    const loadSession = async () => {
      try {
        console.log('Loading initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setUser(null)
            setUserType(null)
            setSession(null)
            setLoading(false)
          }
          return
        }
        
        console.log('Initial session loaded:', session ? 'exists' : 'null')
        if (mounted) {
          await handleSessionChange(session)
        }
      } catch (error) {
        console.error('Failed to load session:', error)
        if (mounted) {
          setUser(null)
          setUserType(null)
          setSession(null)
          setLoading(false)
        }
      }
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      if (!mounted) return
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state')
        setUser(null)
        setUserType(null)
        setSession(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        console.log('User signed in or session updated')
        await handleSessionChange(session)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user:', email)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('Sign in error:', error)
      throw error
    }
    console.log('Sign in successful')
  }

  const signOut = async () => {
    try {
      console.log('Signing out user...')
      // Clear local state immediately
      setUser(null)
      setUserType(null)
      setSession(null)
      setLoading(false)
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase sign out error:', error)
        // Don't throw error, we've already cleared local state
      }
      console.log('Sign out completed')
    } catch (error) {
      console.error('Failed to sign out:', error)
      // Even if there's an error, clear local state
      setUser(null)
      setUserType(null)
      setSession(null)
      setLoading(false)
      throw error
    }
  }

  const refreshUserType = async () => {
    if (user) {
      console.log('Manually refreshing user type for:', user.email)
      await checkUserType(user.id)
    } else {
      console.log('No user to refresh type for')
    }
  }

  // Connect global function
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


