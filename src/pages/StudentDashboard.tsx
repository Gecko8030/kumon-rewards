import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Coins, Target, TrendingUp, Gift } from 'lucide-react'
import toast from 'react-hot-toast'

interface Student {
  id: string
  name: string
  level: string
  avatar_url: string | null
  kumon_dollars: number
}

interface Goal {
  id: string
  reward: {
    name: string
    cost: number
    image_url: string
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
  const { user } = useAuth()
  const [student, setStudent] = useState<Student | null>(null)
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStudentData()
      fetchCurrentGoal()
      fetchRecentTransactions()
    }
  }, [user])

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setStudent(data)
    } catch (error) {
      toast.error('Failed to load student data')
    }
  }

  const fetchCurrentGoal = async () => {
    try {
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
        .eq('student_id', user?.id)
        .eq('status', 'approved')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setCurrentGoal({
          id: data.id,
          reward: data.rewards as any,
          status: data.status
        })
      }
    } catch (error) {
      console.error('Error fetching goal:', error)
    }
  }

  const fetchRecentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kumon-blue"></div>
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
              <p className="text-xl text-gray-600">Level: {student.level}</p>
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
                  <img 
                    src={currentGoal.reward.image_url} 
                    alt={currentGoal.reward.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
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
