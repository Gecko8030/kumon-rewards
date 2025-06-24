import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import RewardShop from './pages/RewardShop'
import GoalTracker from './pages/GoalTracker'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
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
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  )
}

export default App