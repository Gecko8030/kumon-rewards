import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<'student' | 'admin'>('student')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password, userType)
      toast.success('Welcome back!')
      navigate(userType === 'student' ? '/dashboard' : '/admin')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl card-shadow p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
            <p className="text-gray-600">Sign in to access your rewards</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-4 mb-6">
              <button
                type="button"
                onClick={() => setUserType('student')}
                className={`px-6 py-3 rounded-full font-bold transition-all duration-300 ${
                  userType === 'student'
                    ? 'bg-kumon-blue text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                👨‍🎓 Student
              </button>
              <button
                type="button"
                onClick={() => setUserType('admin')}
                className={`px-6 py-3 rounded-full font-bold transition-all duration-300 ${
                  userType === 'admin'
                    ? 'bg-kumon-orange text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                👨‍🏫 Instructor
              </button>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent transition-all duration-300"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-kumon-yellow bg-opacity-20 rounded-lg">
            <h3 className="font-bold text-kumon-blue mb-2">Demo Accounts:</h3>
            <div className="text-sm space-y-1">
              <p><strong>Student:</strong> student@demo.com / password123</p>
              <p><strong>Instructor:</strong> admin@demo.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}