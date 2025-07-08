import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function SessionMonitor() {
  const { user } = useAuth()
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null)
  const [warningShown, setWarningShown] = useState(false)

  useEffect(() => {
    if (!user) {
      setSessionExpiry(null)
      setWarningShown(false)
      return
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.expires_at) {
          const expiryDate = new Date(session.expires_at * 1000)
          setSessionExpiry(expiryDate)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }

    checkSession()

    // Check session every minute
    const interval = setInterval(checkSession, 60000)

    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!sessionExpiry || warningShown) return

    const now = new Date()
    const timeUntilExpiry = sessionExpiry.getTime() - now.getTime()
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60))

    // Warn user 5 minutes before expiry
    if (minutesUntilExpiry <= 5 && minutesUntilExpiry > 0) {
      toast.error(
        `Your session will expire in ${minutesUntilExpiry} minutes. Please save your work.`,
        { duration: 10000 }
      )
      setWarningShown(true)
    }
    // Warn user 1 minute before expiry
    else if (minutesUntilExpiry <= 1 && minutesUntilExpiry > 0) {
      toast.error(
        'Your session will expire very soon! Please save your work immediately.',
        { duration: 15000 }
      )
      setWarningShown(true)
    }
  }, [sessionExpiry, warningShown])

  // Reset warning when session is refreshed
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        setWarningShown(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return null // This component doesn't render anything
} 