import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

import Home from './pages/Home'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import RewardShop from './pages/RewardShop'
import GoalTracker from './pages/GoalTracker'
import AdminDashboard from './pages/AdminDashboard'

function App() {


  return (
    <ErrorBoundary>
      <AuthProvider>

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