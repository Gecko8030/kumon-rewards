import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { withRetry, isNetworkError } from '../lib/api'
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
    image_url: string | null
  }
  goal_url?: string | null
}

interface Student {
  kumon_dollars: number
}

export default function GoalTracker() {
  const { user, userType, loading: authLoading } = useAuth()
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionVerified, setSessionVerified] = useState(false)
  const [customGoalName, setCustomGoalName] = useState('');
  const [customGoalDescription, setCustomGoalDescription] = useState('');
  const [customGoalUrl, setCustomGoalUrl] = useState('');
  const [submittingCustomGoal, setSubmittingCustomGoal] = useState(false);

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
        await fetchCurrentGoal()
        await fetchStudentData()
        
      } catch (error) {
        console.error('Session verification error:', error)
        setError('Failed to verify session. Please refresh the page.')
        setLoading(false)
      }
    }

    verifySessionAndRole()
  }, [user, userType, authLoading])

  const fetchCurrentGoal = async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching goals')
      setLoading(false)
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
            created_at,
            goal_url,
            rewards (
              id,
              name,
              description,
              cost,
              image_url
            )
          `)
          .eq('student_id', user.id)
          .in('status', ['pending', 'approved'])
          .order('created_at', { ascending: false })
          .limit(1)
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
          status: data.status,
          created_at: data.created_at,
          reward: data.rewards as any,
          goal_url: data.goal_url || null
        })
      } else {
        console.log('No current goal found')
      }
    } catch (error) {
      console.error('Error fetching goal:', error)
      // Don't set error state for goals as they're optional
    } finally {
      setLoading(false)
    }
  }

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
          .select('kumon_dollars')
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
    } finally {
      setLoading(false)
    }
  }

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && sessionVerified) {
        console.warn('Goal tracker loading timeout reached')
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Goal Tracker</h2>
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

  if (!currentGoal) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-white rounded-2xl card-shadow p-12 mb-8">
              <Target className="mx-auto text-gray-400 mb-6" size={80} />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">No Active Goal</h1>
              <p className="text-xl text-gray-600 mb-6">
                You don't have any active goals right now.
              </p>
              {/* Custom Goal Submission Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSubmittingCustomGoal(true);
                  try {
                    const { error } = await supabase
                      .from('goals')
                      .insert({
                        student_id: user.id,
                        reward_id: null,
                        status: 'pending',
                        goal_url: customGoalUrl || null,
                        custom_name: customGoalName,
                        custom_description: customGoalDescription
                      });
                    if (error) throw error;
                    toast.success('Goal submitted for approval!');
                    setCustomGoalName('');
                    setCustomGoalDescription('');
                    setCustomGoalUrl('');
                    // Refetch goal state
                    await fetchCurrentGoal();
                  } catch (err) {
                    toast.error('Failed to submit goal');
                  } finally {
                    setSubmittingCustomGoal(false);
                  }
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  placeholder="Goal Name (e.g., Nintendo Switch)"
                  value={customGoalName}
                  onChange={e => setCustomGoalName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                  required
                />
                <textarea
                  placeholder="Description (e.g., I want to save up for a Nintendo Switch)"
                  value={customGoalDescription}
                  onChange={e => setCustomGoalDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                  rows={3}
                  required
                />
                <input
                  type="url"
                  placeholder="Amazon or product link (optional)"
                  value={customGoalUrl}
                  onChange={e => setCustomGoalUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                  pattern="https?://.*"
                />
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={submittingCustomGoal}
                >
                  {submittingCustomGoal ? 'Submitting...' : 'Submit Goal for Approval'}
                </button>
              </form>
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
              {currentGoal.reward.image_url ? (
                <img
                  src={currentGoal.reward.image_url}
                  alt={currentGoal.reward.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-lg">No Image Available</span>
                </div>
              )}
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
          {currentGoal.goal_url && (
            <div className="mt-4">
              <a
                href={currentGoal.goal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-kumon-blue underline break-all"
              >
                View Product Link
              </a>
            </div>
          )}
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
              <div className="w-full bg-white bg-opacity-20 rounded-full h-6">
                <div 
                  className="bg-kumon-yellow h-6 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {progressPercentage > 20 && `${Math.round(progressPercentage)}%`}
                </div>
              </div>
            </div>

            {dollarsNeeded > 0 ? (
              <div className="text-center">
                <p className="text-xl mb-4">You need {dollarsNeeded} more Kumon Dollars to reach your goal!</p>
                <p className="text-lg opacity-90">Keep up the great work! 💪</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
                <p className="text-xl">You've reached your goal! Contact your instructor to claim your reward.</p>
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
