import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Home, ShoppingBag, Target, User, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import kumonFace from '../assets/kumonface.png';
import { SIGN_OUT_SCOPES } from '@supabase/supabase-js'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, userType, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully!')
      navigate('/')
    } catch (error) {
      toast.error('Error signing out')
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
                      <span>Shop</span>
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
                    <Link to="/admin" className="flex items-center space-x-1 text-gray-700 hover:text-kumon-blue transition-colors">
                      <Settings size={20} />
                      <span>Admin</span>
                    </Link>
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