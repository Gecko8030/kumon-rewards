import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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
  
  // Use refs to prevent unnecessary re-renders and track state
  const userTypeCheckInProgress = useRef(false)
  const lastUserTypeCheck = useRef<number>(0)
  const authListenerSet = useRef(false)

  // Check user type (admin first, then student) - with debouncing
  const checkUserType = useCallback(async (userId: string) => {
    // Prevent multiple simultaneous checks
    if (userTypeCheckInProgress.current) {
      console.log('🔍 User type check already in progress, skipping...')
      return
    }
    
    // Debounce checks - only allow one check every 30 seconds
    const now = Date.now()
    if (now - lastUserTypeCheck.current < 30000) {
      console.log('🔍 User type check debounced (last check was', Math.round((now - lastUserTypeCheck.current) / 1000), 'seconds ago)')
      return
    }
    
    userTypeCheckInProgress.current = true
    lastUserTypeCheck.current = now
    
    console.log('🔍 Checking user type for:', userId)
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('User type check timeout')), 8000) // 8 second timeout
    })
    
    try {
      const checkPromise = async () => {
        // Check admin table first
        const { data: admin, error: adminError } = await supabase
          .from('admin')
          .select('id')
          .eq('id', userId)
          .maybeSingle()

        if (adminError) {
          console.error('❌ Admin check error:', adminError)
          // Clear userType on network errors to force re-authentication
          setUserType(null)
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
          // Clear userType on network errors to force re-authentication
          setUserType(null)
          return
        }

        if (student) {
          console.log('✅ User is student')
          setUserType('student')
          return
        }

        // User not found in either table - clear everything
        console.log('❌ User not found in admin or student tables, clearing userType')
        setUserType(null)
      }
      
      await Promise.race([checkPromise(), timeoutPromise])
    } catch (err) {
      console.error('❌ User type check error:', err)
      // Clear userType on exceptions to force re-authentication
      setUserType(null)
    } finally {
      userTypeCheckInProgress.current = false
    }
  }, [])

  // Handle session change and role restoration
  const handleSessionChange = useCallback(async (session: Session | null) => {
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
  }, [checkUserType])

  // Single useEffect for session restoration and auth state changes
  useEffect(() => {
    let mounted = true
    
    // Prevent multiple listeners
    if (authListenerSet.current) {
      console.log('⚠️ Auth listener already set, skipping...')
      return
    }
    
    authListenerSet.current = true
    
    const initializeAuth = async () => {
      setLoading(true)
      
      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('⚠️ Authentication initialization timeout - forcing completion')
          setLoading(false)
          // Don't clear user state on timeout, let the auto-sign out handle it
        }
      }, 10000) // 10 second timeout
      
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('❌ Error getting initial session:', error)
          setUser(null)
          setUserType(null)
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }
        
        if (mounted) {
          await handleSessionChange(session)
          clearTimeout(timeoutId)
        }
      } catch (error) {
        console.error('❌ Error during auth initialization:', error)
        setUser(null)
        setUserType(null)
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }
    
    initializeAuth()
    
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        await handleSessionChange(session)
      }
    })
    
    return () => {
      mounted = false
      authListenerSet.current = false
      listener.subscription.unsubscribe()
    }
  }, [handleSessionChange])

  // Auto-sign out if user exists but userType is null after loading
  useEffect(() => {
    if (!loading && user && userType === null) {
      console.log('🚨 User exists but userType is null - auto signing out')
      // Add a small delay to prevent immediate sign out during initialization
      const timeoutId = setTimeout(() => {
        signOut()
      }, 1000)
      
      return () => clearTimeout(timeoutId)
    }
  }, [user, userType, loading])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null)
      setUserType(null)
      setLoading(false)
      
      // Reset refs
      userTypeCheckInProgress.current = false
      lastUserTypeCheck.current = 0
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase sign out error:', error)
        // Don't throw - we've already cleared local state
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Ensure state is cleared even if there's an error
      setUser(null)
      setUserType(null)
      setLoading(false)
      throw error
    }
  }

  const refreshUserType = useCallback(async () => {
    if (user) {
      // Force a fresh check by resetting the debounce timer
      lastUserTypeCheck.current = 0
      await checkUserType(user.id)
    }
  }, [user, checkUserType])

  useEffect(() => {
    (window as any).refreshUserType = refreshUserType
    return () => {
      delete (window as any).refreshUserType
    }
  }, [refreshUserType])

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
