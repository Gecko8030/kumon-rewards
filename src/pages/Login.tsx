import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../lib/toast'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  // Check if there's a pending student signup
  useEffect(() => {
    const tempStudentInfo = localStorage.getItem('tempStudentInfo')
    if (tempStudentInfo) {
      try {
        const studentInfo = JSON.parse(tempStudentInfo)
        setEmail(studentInfo.email)
        setPassword(studentInfo.password)
        setConfirmPassword(studentInfo.password)
        setIsSignup(true)
        showToast.success(`Welcome ${studentInfo.name}! Please complete your signup.`)
      } catch (error) {
        console.error('Error parsing temp student info:', error)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignup) {
        // Handle student signup
        if (password !== confirmPassword) {
          showToast.error('Passwords do not match')
          return
        }

        if (password.length < 6) {
          showToast.error('Password must be at least 6 characters long')
          return
        }

        // Sign up the student
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          throw error
        }

        if (data.user) {
          // Create the student record in the database with the auth user ID
          const studentInfo = JSON.parse(localStorage.getItem('tempStudentInfo') || '{}')
          const { error: insertError } = await supabase
            .from('students')
            .insert({
              id: data.user.id, // Use the auth user ID as the student ID
              email: email,
              name: studentInfo.name || 'Student',
              kumon_dollars: 0
            })

          if (insertError) {
            console.error('Error creating student record:', insertError)
            // Don't throw here as the user is already created
            showToast.error('Account created but there was an issue with your profile. Please contact an administrator.')
          } else {
            showToast.success('Account created successfully! You can now sign in.')
          }

          // Clear the temp student info
          localStorage.removeItem('tempStudentInfo')
          
          setIsSignup(false)
          setEmail('')
          setPassword('')
          setConfirmPassword('')
        }
      } else {
        // Handle regular sign in
        await signIn(email, password)
        showToast.success('Welcome back!')
        
        // Navigate to home and let the app handle routing based on user type
        navigate('/')
      }
    } catch (error: any) {
      showToast.error(error.message || (isSignup ? 'Failed to sign up' : 'Failed to sign in'))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMode = () => {
    setIsSignup(!isSignup)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    localStorage.removeItem('tempStudentInfo')
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl card-shadow p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignup ? 'Create Your Account' : 'Welcome Back!'}
            </h2>
            <p className="text-gray-600">
              {isSignup ? 'Complete your student account setup' : 'Sign in to access your rewards'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={isSignup && localStorage.getItem('tempStudentInfo') !== null}
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

            {isSignup && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent transition-all duration-300"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (isSignup ? 'Creating Account...' : 'Signing In...') 
                : (isSignup ? 'Create Account' : 'Sign In')
              }
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-kumon-blue hover:text-kumon-blue-dark transition-colors"
            >
              {isSignup 
                ? 'Already have an account? Sign in' 
                : 'Need to create an account? Sign up'
              }
            </button>
          </div>

          {!isSignup && (
            <div className="mt-8 p-4 bg-kumon-yellow bg-opacity-20 rounded-lg">
              <h3 className="font-bold text-kumon-blue mb-2">Demo Accounts:</h3>
              <div className="text-sm space-y-1">
                <p><strong>Student:</strong> student@demo.com / password123</p>
                <p><strong>Instructor:</strong> admin@demo.com / password123</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}