import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Home, ShoppingBag, Target, User, Settings } from 'lucide-react'
import { showToast } from '../lib/toast'
import kumonFace from '../assets/kumonface.png';

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, userType, loading, signOut, refreshUserType } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      console.log('Layout: Starting sign out process...')
      
      // Try the normal sign out first
      await signOut()
      console.log('Layout: Sign out completed, showing success toast')
      showToast.success('Signed out successfully!')
      console.log('Layout: Navigating to home page')
      navigate('/')
    } catch (error) {
      console.error('Layout: Sign out error:', error)
      
      // Fallback: manually clear everything
      console.log('Layout: Using fallback sign out...')
      
      // Clear localStorage manually
      localStorage.clear()
      sessionStorage.clear()
      
      // Force page reload to clear all state
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src={kumonFace}
                  alt="Kumon Logo"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-2xl font-bold text-kumon-blue">Kumon Rewards</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/" className="flex items-center space-x-1 text-gray-700 hover:text-kumon-blue transition-colors">
                    <Home size={20} />
                    <span>Home</span>
                  </Link>

                  {(userType === 'student' || userType === 'admin') && (
                    <Link to="/shop" className="flex items-center space-x-1 text-gray-700 hover:text-kumon-blue transition-colors">
                      <ShoppingBag size={20} />
                      <span>Reward Shop</span>
                    </Link>
                  )}

                  {userType === 'student' && (
                    <>
                      <Link to="/dashboard" className="flex items-center space-x-1 text-gray-700 hover:text-kumon-blue transition-colors">
                        <User size={20} />
                        <span>Dashboard</span>
                      </Link>
                      <Link to="/goals" className="flex items-center space-x-1 text-gray-700 hover:text-kumon-blue transition-colors">
                        <Target size={20} />
                        <span>Goals</span>
                      </Link>
                    </>
                  )}

                  {userType === 'admin' && (
                    <>
                      <Link to="/admin" className="flex items-center space-x-1 text-gray-700 hover:text-kumon-blue transition-colors">
                        <Settings size={20} />
                        <span>Admin</span>
                      </Link>
                      <button
                        onClick={refreshUserType}
                        className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors text-xs"
                        title="Refresh permissions"
                      >
                        🔄
                      </button>
                    </>
                  )}

                  <button 
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/shop" className="flex items-center space-x-1 text-gray-700 hover:text-kumon-blue transition-colors">
                    <ShoppingBag size={20} />
                    <span>Reward Shop</span>
                  </Link>
                  <Link to="/login" className="btn-primary">
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}