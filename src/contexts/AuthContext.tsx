import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
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

  // Check user type once and cache the result
  const checkUserType = useCallback(async (userId: string) => {
    try {
      // Try to check if user is an admin (try both 'admin' and 'admins' table names)
      let isAdmin = false
      
      // Try 'admin' table first
      try {
        const { data: admin, error: adminError } = await supabase
          .from('admin')
          .select('id')
          .eq('id', userId)
          .maybeSingle()

        if (!adminError && admin) {
          isAdmin = true
        }
      } catch (err) {
        // Table might not exist, try 'admins' instead
        try {
          const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('id')
            .eq('id', userId)
            .maybeSingle()

          if (!adminError && admin) {
            isAdmin = true
          }
        } catch (err2) {
          console.log('Both admin table names failed, user is not an admin')
        }
      }

      if (isAdmin) {
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
        console.error('Student check error:', studentError)
        return
      }

      if (student) {
        setUserType('student')
        return
      }

      // User not found in either table
      setUserType(null)
    } catch (err) {
      console.error('User type check error:', err)
      setUserType(null)
    }
  }, [])

  // Initialize auth state ONCE when component mounts
  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        // Get initial session only once
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting initial session:', error)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          setUser(session.user)
          // Check user type once
          await checkUserType(session.user.id)
        } else {
          setUser(null)
          setUserType(null)
        }
        
        setLoading(false)
      } catch (error) {
        if (mounted) {
          console.error('Error during auth initialization:', error)
          setLoading(false)
        }
      }
    }
    
    initializeAuth()
    
    return () => {
      mounted = false
    }
  }, [checkUserType])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
    // Update state after successful sign in
    if (data.user) {
      setUser(data.user)
      await checkUserType(data.user.id)
    }
  }

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null)
      setUserType(null)
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase sign out error:', error)
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Ensure state is cleared even if there's an error
      setUser(null)
      setUserType(null)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      userType,
      loading,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}
