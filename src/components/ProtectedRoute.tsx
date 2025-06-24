import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredUserType?: 'student' | 'admin'
}

export default function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const { user, userType, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kumon-blue"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requiredUserType && userType !== requiredUserType) {
    return <Navigate to="/" />
  }

  return <>{children}</>
}