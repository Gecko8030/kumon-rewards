import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredUserType?: 'student' | 'admin'
}

export default function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const { user, userType, loading } = useAuth()
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    if (loading) {
      // Set a timeout of 15 seconds to prevent infinite loading
      const timeout = setTimeout(() => {
        console.warn('Authentication loading timeout reached')
        setTimeoutReached(true)
      }, 15000)

      return () => clearTimeout(timeout)
    } else {
      setTimeoutReached(false)
    }
  }, [loading])

  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kumon-blue"></div>
      </div>
    )
  }

  // If timeout reached and still loading, redirect to login
  if (timeoutReached) {
    console.log('Redirecting to login due to timeout')
    return <Navigate to="/login" />
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requiredUserType && userType !== requiredUserType) {
    return <Navigate to="/" />
  }

  return <>{children}</>
}