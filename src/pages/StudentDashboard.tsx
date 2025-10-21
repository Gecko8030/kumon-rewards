import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { withRetry, isNetworkError } from '../lib/api'
import { Coins, Target, TrendingUp, Gift } from 'lucide-react'
import toast from 'react-hot-toast'

interface Student {
  id: string
  name: string
  avatar_url: string | null
  kumon_dollars: number
  grade: string
}

interface Goal {
  id: string
  reward: {
    name: string
    cost: number
    image_url: string | null
  }
  status: string
}

interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  created_at: string
}

export default function StudentDashboard() {
  const { user, userType, loading: authLoading } = useAuth()
  const [student, setStudent] = useState<Student | null>(null)
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionVerified, setSessionVerified] = useState(false)

  // Verify session and role on mount and when auth state changes
  useEffect(() => {
    const verifySessionAndRole = async () => {
      if (authLoading) return

      try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session verification failed:', sessionError)
          setError('Authentication error. Please log in again.')
          setLoading(false)
          return
        }

        if (!session) {
          console.log('No active session found')
          setError('No active session. Please log in again.')
          setLoading(false)
          return
        }

        // Verify user is a student
        if (userType !== 'student') {
          console.log('User is not a student:', userType)
          setError('Access denied. Student account required.')
          setLoading(false)
          return
        }

        console.log('Session and role verified successfully')
        setSessionVerified(true)
        
        // Fetch data only after session and role are verified
        await fetchStudentData()
        await fetchCurrentGoal()
        await fetchRecentTransactions()
        
      } catch (error) {
        console.error('Session verification error:', error)
        setError('Failed to verify session. Please refresh the page.')
        setLoading(false)
      }
    }

    verifySessionAndRole()
  }, [user, userType, authLoading])

  const fetchStudentData = async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching student data')
      return
    }

    try {
      console.log('Fetching student data for user:', user.id)
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Student data fetch error:', error)
          throw error
        }
        return data
      })

      console.log('Student data fetched successfully:', data)
      setStudent(data)
    } catch (error) {
      console.error('Failed to load student data:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error - please check your connection' 
        : 'Failed to load student data'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const fetchCurrentGoal = async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching goals')
      return
    }

    try {
      console.log('Fetching current goal for user:', user.id)
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('goals')
          .select(`
            id,
            status,
            rewards (
              name,
              cost,
              image_url
            )
          `)
          .eq('student_id', user.id)
          .eq('status', 'approved')
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Goal fetch error:', error)
          throw error
        }
        return data
      })

      if (data) {
        console.log('Current goal fetched successfully:', data)
        setCurrentGoal({
          id: data.id,
          reward: data.rewards as any,
          status: data.status
        })
      } else {
        console.log('No current goal found')
      }
    } catch (error) {
      console.error('Error fetching goal:', error)
      // Don't set error state for goals as they're optional
    }

  }

  const fetchRecentTransactions = async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching transactions')
      return
    }

    try {
      console.log('Fetching recent transactions for user:', user.id)
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) {
          console.error('Transactions fetch error:', error)
          throw error
        }
        return data
      })

      console.log('Recent transactions fetched successfully:', data)
      setRecentTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      // Don't set error state for transactions as they're optional
    } finally {
      setLoading(false)
    }
  }

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && sessionVerified) {
        console.warn('Dashboard loading timeout reached')
        setLoading(false)
        setError('Loading timeout - please refresh the page')
      }
    }, 15000) // 15 second timeout

    return () => clearTimeout(timeout)
  }, [loading, sessionVerified])

  // Show loading while auth is loading or session is being verified
  if (authLoading || !sessionVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kumon-blue"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kumon-blue"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Student profile not found</h2>
          <p className="text-gray-600">Please contact your instructor to set up your profile.</p>
        </div>
      </div>
    )
  }

  const progressPercentage = currentGoal 
    ? Math.min((student.kumon_dollars / currentGoal.reward.cost) * 100, 100)
    : 0

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl card-shadow p-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-kumon-blue to-kumon-purple rounded-full flex items-center justify-center">
              {student.avatar_url ? (
                <img src={student.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-3xl text-white">👨‍🎓</span>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {student.name}! 🌟</h1>
              <p className="text-lg text-gray-600">{student.grade}</p>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kumon Dollars Balance */}
          <div className="bg-gradient-to-br from-kumon-yellow to-kumon-orange rounded-2xl card-shadow p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Kumon Dollars</h2>
              <Coins className="coin-animation" size={40} />
            </div>
            <div className="text-5xl font-bold mb-2">{student.kumon_dollars}</div>
            <p className="text-lg opacity-90">Keep learning to earn more!</p>
          </div>

          {/* Current Goal */}
          <div className="lg:col-span-2 bg-white rounded-2xl card-shadow p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Target className="text-kumon-blue" size={28} />
              <h2 className="text-2xl font-bold text-gray-900">Current Goal</h2>
            </div>

            {currentGoal ? (
              <div>
                <div className="flex items-center space-x-4 mb-6">
                  {currentGoal.reward.image_url ? (
                    <img 
                      src={currentGoal.reward.image_url} 
                      alt={currentGoal.reward.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{currentGoal.reward.name}</h3>
                    <p className="text-lg text-gray-600">Cost: {currentGoal.reward.cost} Kumon Dollars</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                    <span>Progress: {student.kumon_dollars} / {currentGoal.reward.cost}</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div 
                      className="progress-bar h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      {progressPercentage > 20 && `${Math.round(progressPercentage)}%`}
                    </div>
                  </div>
                </div>

                {student.kumon_dollars >= currentGoal.reward.cost && (
                  <div className="bg-kumon-green bg-opacity-20 border border-kumon-green rounded-lg p-4">
                    <p className="text-kumon-green font-bold text-center">
                      🎉 Congratulations! You can claim your reward! Contact your instructor.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Gift className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Goal Set</h3>
                <p className="text-gray-600 mb-4">Ask your instructor to help you set a goal!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-2xl card-shadow p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="text-kumon-green" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'earned' ? 'bg-kumon-green' : 'bg-kumon-orange'
                    }`}>
                      {transaction.type === 'earned' ? '💰' : '🎁'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${
                    transaction.type === 'earned' ? 'text-kumon-green' : 'text-kumon-orange'
                  }`}>
                    {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity. Start learning to earn Kumon Dollars!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}