import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import SessionMonitor from './components/SessionMonitor'
import Home from './pages/Home'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import RewardShop from './pages/RewardShop'
import GoalTracker from './pages/GoalTracker'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  // Add emergency sign out function to window for debugging
  React.useEffect(() => {
    (window as any).emergencySignOut = () => {
      console.log('Emergency sign out triggered')
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    }
    
    // Add refresh user type function
    (window as any).refreshUserType = () => {
      console.log('Manual user type refresh triggered')
      // This will be set by the AuthProvider
    }
    
    return () => {
      delete (window as any).emergencySignOut
      delete (window as any).refreshUserType
    }
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SessionMonitor />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/shop" element={<RewardShop />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/goals" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <GoalTracker />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredUserType="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Layout>
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                fontSize: '14px',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
            gutter={8}
          />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App