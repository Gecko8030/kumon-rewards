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
  const [error, setError] = useState<string | null>(null)

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

  // Handle any errors during auth state changes
  useEffect(() => {
    if (!loading && !user && userType !== null) {
      console.log('User cleared during loading, redirecting to login')
      setError('Session expired. Please log in again.')
    }
  }, [user, userType, loading])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-kumon-blue text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kumon-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
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