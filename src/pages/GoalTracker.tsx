import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Target, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Goal {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  reward: {
    id: string
    name: string
    description: string
    cost: number
    image_url: string
  }
}

interface Student {
  kumon_dollars: number
}

export default function GoalTracker() {
  const { user } = useAuth()
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCurrentGoal()
      fetchStudentData()
    }
  }, [user])

  const fetchCurrentGoal = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select(`
          id,
          status,
          created_at,
          rewards (
            id,
            name,
            description,
            cost,
            image_url
          )
        `)
        .eq('student_id', user?.id)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setCurrentGoal({
          id: data.id,
          status: data.status,
          created_at: data.created_at,
          reward: data.rewards as any
        })
      }
    } catch (error) {
      console.error('Error fetching goal:', error)
    }
  }

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('kumon_dollars')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setStudent(data)
    } catch (error) {
      toast.error('Failed to load student data')
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

  if (!currentGoal) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-white rounded-2xl card-shadow p-12">
              <Target className="mx-auto text-gray-400 mb-6" size={80} />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">No Active Goal</h1>
              <p className="text-xl text-gray-600">
                You don't have any active goals right now.
              </p>
              {/* Button Removed */}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const progressPercentage = student
    ? Math.min((student.kumon_dollars / currentGoal.reward.cost) * 100, 100)
    : 0

  const dollarsNeeded = Math.max(currentGoal.reward.cost - (student?.kumon_dollars || 0), 0)

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎯 Goal Tracker</h1>
          <p className="text-xl text-white">Track your progress toward your reward!</p>
        </div>

        <div className="bg-white rounded-2xl card-shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Goal Status</h2>
            <div className={`px-4 py-2 rounded-full font-bold ${
              currentGoal.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : currentGoal.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {currentGoal.status === 'pending' && (
                <div className="flex items-center space-x-2">
                  <Clock size={16} />
                  <span>Pending Approval</span>
                </div>
              )}
              {currentGoal.status === 'approved' && (
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} />
                  <span>Approved</span>
                </div>
              )}
            </div>
          </div>

          {currentGoal.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                Your goal is waiting for instructor approval. You'll be notified once it's approved!
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl card-shadow p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <img
                src={currentGoal.reward.image_url}
                alt={currentGoal.reward.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{currentGoal.reward.name}</h2>
              <p className="text-lg text-gray-600 mb-6">{currentGoal.reward.description}</p>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-3xl">💰</span>
                <span className="text-3xl font-bold text-kumon-orange">{currentGoal.reward.cost}</span>
                <span className="text-lg text-gray-600">Kumon Dollars</span>
              </div>
              <p className="text-sm text-gray-500">
                Goal set on {new Date(currentGoal.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {currentGoal.status === 'approved' && student && (
          <div className="bg-gradient-to-br from-kumon-blue to-kumon-purple rounded-2xl card-shadow p-8 text-white">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Your Progress</h2>
              <div className="text-6xl font-bold mb-2">{Math.round(progressPercentage)}%</div>
              <p className="text-xl opacity-90">Complete</p>
            </div>

            <div className="mb-8">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Kumon Dollars Saved: {student.kumon_dollars}</span>
                <span>Goal: {currentGoal.reward.cost}</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-8">
                <div
                  className="bg-gradient-to-r from-kumon-yellow to-kumon-orange h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {progressPercentage > 15 && `${Math.round(progressPercentage)}%`}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-2xl font-bold">{student.kumon_dollars}</div>
                <div className="text-sm opacity-80">Dollars Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold">{dollarsNeeded}</div>
                <div className="text-sm opacity-80">Dollars Needed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">📈</div>
                <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
                <div className="text-sm opacity-80">Progress</div>
              </div>
            </div>

            {progressPercentage >= 100 && (
              <div className="mt-8 bg-white bg-opacity-20 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
                <p className="text-lg">
                  You've reached your goal! Contact your instructor to claim your reward.
                </p>
              </div>
            )}

            {progressPercentage < 100 && (
              <div className="mt-8 bg-white bg-opacity-20 rounded-lg p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Keep Going!</h3>
                <p className="text-lg">
                  You need {dollarsNeeded} more Kumon Dollars to reach your goal. Keep learning!
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-white rounded-2xl card-shadow p-8">
          <div className="text-center">
            <TrendingUp className="mx-auto text-kumon-green mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tips to Reach Your Goal</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-kumon-blue bg-opacity-10 rounded-lg">
                <div className="text-2xl mb-2">📚</div>
                <h3 className="font-bold text-kumon-blue mb-2">Complete Worksheets</h3>
                <p className="text-sm text-gray-600">Finish your daily Kumon worksheets to earn dollars</p>
              </div>
              <div className="p-4 bg-kumon-green bg-opacity-10 rounded-lg">
                <div className="text-2xl mb-2">⭐</div>
                <h3 className="font-bold text-kumon-green mb-2">Show Improvement</h3>
                <p className="text-sm text-gray-600">Demonstrate progress in your studies</p>
              </div>
              <div className="p-4 bg-kumon-orange bg-opacity-10 rounded-lg">
                <div className="text-2xl mb-2">🏆</div>
                <h3 className="font-bold text-kumon-orange mb-2">Stay Consistent</h3>
                <p className="text-sm text-gray-600">Regular attendance and effort pay off</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
