import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { withRetry, isNetworkError, checkConnection } from '../lib/api'
import { Users, DollarSign, Target, Package, Plus, Check, X, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Student {
  id: string
  name: string
  email: string
  level: string
  kumon_dollars: number
}

interface Goal {
  id: string
  status: string
  created_at: string
  student: {
    name: string
    email: string
  }
  reward: {
    name: string
    cost: number
    image_url: string | null
  }
  goal_url?: string | null // Added goal_url to the Goal interface
}

interface Reward {
  id: string
  name: string
  description: string
  cost: number
  image_url: string | null
  category: string
  available: boolean
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('students')
  const [students, setStudents] = useState<Student[]>([])
  const [pendingGoals, setPendingGoals] = useState<Goal[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddReward, setShowAddReward] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [savingReward, setSavingReward] = useState(false)

  // Form states
  const [selectedStudent, setSelectedStudent] = useState('')
  const [dollarAmount, setDollarAmount] = useState('')
  const [description, setDescription] = useState('')
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    cost: '',
    image_url: '',
    category: 'toys'
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Admin dashboard loading timeout reached')
        setLoading(false)
        // Don't set error if we have some data loaded
        if (students.length === 0 && pendingGoals.length === 0 && rewards.length === 0) {
          setError('Loading timeout - the database may be slow or unavailable. Please try refreshing.')
        }
      }
    }, 20000) // Increased to 20 second timeout to prevent premature timeouts

    return () => clearTimeout(timeout)
  }, [loading, students.length, pendingGoals.length, rewards.length])

  const fetchData = async () => {
    console.log('AdminDashboard: Starting to fetch data...')
    try {
      // Check connection first (but don't block if it fails)
      try {
        const isConnected = await checkConnection()
        if (!isConnected) {
          console.warn('AdminDashboard: No database connection detected, but continuing...')
        }
      } catch (error) {
        console.warn('AdminDashboard: Connection check failed, but continuing...', error)
      }

      // Fetch data independently to prevent one failure from blocking others
      const results = await Promise.allSettled([
        fetchStudents(),
        fetchPendingGoals(),
        fetchRewards()
      ])
      
      console.log('AdminDashboard: All fetch operations completed:', results.map(r => r.status))
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
      setError('Failed to load admin data')
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    console.log('AdminDashboard: Fetching students...')
    try {
      const data = await withRetry(async () => {
        // Add individual timeout for this operation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Students fetch timeout')), 15000)
        })
        
        const fetchPromise = supabase
          .from('students')
          .select('*')
          .order('name')

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

        if (error) throw error
        return data
      })

      console.log('AdminDashboard: Students fetched successfully:', data?.length)
      setStudents(data)
    } catch (error) {
      console.error('Failed to load students:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error loading students' 
        : 'Failed to load students'
      toast.error(errorMessage)
      // Don't throw error to prevent blocking other fetches
    }
  }

  const fetchPendingGoals = async () => {
    console.log('AdminDashboard: Fetching pending goals...')
    try {
      const data = await withRetry(async () => {
        // Add individual timeout for this operation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Goals fetch timeout')), 15000)
        })
        
        const fetchPromise = supabase
          .from('goals')
          .select(`
            id,
            status,
            created_at,
            students (
              name,
              email
            ),
            rewards (
              name,
              cost,
              image_url
            ),
            goal_url
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

        if (error) throw error
        return data
      })

      console.log('AdminDashboard: Pending goals fetched successfully:', data?.length)
      setPendingGoals(data.map((goal: any) => ({
        id: goal.id,
        status: goal.status,
        created_at: goal.created_at,
        student: goal.students as any,
        reward: goal.rewards as any,
        goal_url: goal.goal_url // Add goal_url to the mapped object
      })))
    } catch (error) {
      console.error('Failed to load pending goals:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error loading goals' 
        : 'Failed to load pending goals'
      toast.error(errorMessage)
      // Don't throw error to prevent blocking other fetches
    }
  }

  const fetchRewards = async () => {
    console.log('AdminDashboard: Fetching rewards...')
    try {
      const data = await withRetry(async () => {
        // Add individual timeout for this operation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Rewards fetch timeout')), 15000)
        })
        
        const fetchPromise = supabase
          .from('rewards')
          .select('*')
          .order('name')

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

        if (error) throw error
        return data
      })

      console.log('AdminDashboard: Rewards fetched successfully:', data?.length)
      setRewards(data)
    } catch (error) {
      console.error('Failed to load rewards:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error loading rewards' 
        : 'Failed to load rewards'
      toast.error(errorMessage)
      // Don't throw error to prevent blocking other fetches
    }
  }

  const addKumonDollars = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !dollarAmount || !description) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const amount = parseInt(dollarAmount)
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount (positive number)')
        return
      }
      
      // Update student balance with retry
      await withRetry(async () => {
        const { error: updateError } = await supabase.rpc('add_kumon_dollars', {
          student_id: selectedStudent,
          amount: amount
        })

        if (updateError) throw updateError
      })

      // Add transaction record with retry
      await withRetry(async () => {
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            student_id: selectedStudent,
            amount: amount,
            type: 'earned',
            description: description
          })

        if (transactionError) throw transactionError
      })

      toast.success('Kumon Dollars added successfully!')
      setSelectedStudent('')
      setDollarAmount('')
      setDescription('')
      
      // Refresh students list with retry
      try {
        await fetchStudents()
      } catch (error) {
        console.error('Failed to refresh students after adding dollars:', error)
        // Don't show error to user since the operation was successful
      }
    } catch (error) {
      console.error('Failed to add Kumon Dollars:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error - please try again' 
        : 'Failed to add Kumon Dollars'
      toast.error(errorMessage)
    }
  }

  const approveGoal = async (goalId: string) => {
    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from('goals')
          .update({ status: 'approved' })
          .eq('id', goalId)

        if (error) throw error
      })
      
      toast.success('Goal approved!')
      
      // Refresh goals list with retry
      try {
        await fetchPendingGoals()
      } catch (error) {
        console.error('Failed to refresh goals after approval:', error)
        // Don't show error to user since the approval was successful
      }
    } catch (error) {
      console.error('Failed to approve goal:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error - please try again' 
        : 'Failed to approve goal'
      toast.error(errorMessage)
    }
  }

  const rejectGoal = async (goalId: string) => {
    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from('goals')
          .update({ status: 'rejected' })
          .eq('id', goalId)

        if (error) throw error
      })
      
      toast.success('Goal rejected')
      
      // Refresh goals list with retry
      try {
        await fetchPendingGoals()
      } catch (error) {
        console.error('Failed to refresh goals after rejection:', error)
        // Don't show error to user since the rejection was successful
      }
    } catch (error) {
      console.error('Failed to reject goal:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error - please try again' 
        : 'Failed to reject goal'
      toast.error(errorMessage)
    }
  }

  const saveReward = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (savingReward) return // Prevent multiple submissions
    
    // Validate form data
    if (!newReward.name.trim() || !newReward.description.trim() || !newReward.cost) {
      toast.error('Please fill in all required fields')
      return
    }

    const cost = parseInt(newReward.cost)
    if (isNaN(cost) || cost <= 0) {
      toast.error('Please enter a valid cost (positive number)')
      return
    }
    
    setSavingReward(true)
    
    try {
      const rewardData = {
        name: newReward.name.trim(),
        description: newReward.description.trim(),
        cost: cost,
        image_url: newReward.image_url.trim() || null,
        category: newReward.category,
        available: true
      }

      if (editingReward) {
        await withRetry(async () => {
          const { error } = await supabase
            .from('rewards')
            .update(rewardData)
            .eq('id', editingReward.id)

          if (error) throw error
        })
        toast.success('Reward updated!')
      } else {
        await withRetry(async () => {
          const { error } = await supabase
            .from('rewards')
            .insert(rewardData)

          if (error) throw error
        })
        toast.success('Reward added!')
      }

      // Reset form
      setShowAddReward(false)
      setEditingReward(null)
      setNewReward({
        name: '',
        description: '',
        cost: '',
        image_url: '',
        category: 'toys'
      })

      // Refresh rewards list with retry
      try {
        await fetchRewards()
      } catch (error) {
        console.error('Failed to refresh rewards after save:', error)
        // Don't show error to user since the save was successful
      }
    } catch (error) {
      console.error('Failed to save reward:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error - please try again' 
        : 'Failed to save reward'
      toast.error(errorMessage)
    } finally {
      setSavingReward(false)
    }
  }

  const deleteReward = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return

    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from('rewards')
          .delete()
          .eq('id', rewardId)

        if (error) throw error
      })
      
      toast.success('Reward deleted')
      
      // Refresh rewards list with retry
      try {
        await fetchRewards()
      } catch (error) {
        console.error('Failed to refresh rewards after delete:', error)
        // Don't show error to user since the delete was successful
      }
    } catch (error) {
      console.error('Failed to delete reward:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error - please try again' 
        : 'Failed to delete reward'
      toast.error(errorMessage)
    }
  }

  const startEditReward = (reward: Reward) => {
    setEditingReward(reward)
    setNewReward({
      name: reward.name,
      description: reward.description,
      cost: reward.cost.toString(),
      image_url: reward.image_url || '',
      category: reward.category
    })
    setShowAddReward(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">👨‍🏫 Admin Dashboard</h1>
          </div>
          
          <div className="bg-white rounded-2xl card-shadow p-8 text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kumon-blue mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Admin Dashboard</h2>
            <p className="text-gray-600">Connecting to database and loading data...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">👨‍🏫 Admin Dashboard</h1>
          </div>
          
          <div className="bg-white rounded-2xl card-shadow p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection Issue</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={() => {
                  setLoading(true)
                  setError(null)
                  fetchData()
                }}
                className="btn-primary"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div></div> {/* Spacer */}
            <h1 className="text-4xl font-bold text-white">👨‍🏫 Admin Dashboard</h1>
            <button
              onClick={() => {
                setRefreshing(true)
                setError(null)
                fetchData().finally(() => setRefreshing(false))
              }}
              disabled={refreshing}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
          <p className="text-xl text-white">Manage students, rewards, and goals</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl card-shadow mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'students'
                  ? 'border-b-2 border-kumon-blue text-kumon-blue'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="inline-block mr-2" size={20} />
              Students
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'goals'
                  ? 'border-b-2 border-kumon-blue text-kumon-blue'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Target className="inline-block mr-2" size={20} />
              Pending Goals ({pendingGoals.length})
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'rewards'
                  ? 'border-b-2 border-kumon-blue text-kumon-blue'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="inline-block mr-2" size={20} />
              Rewards
            </button>
          </div>

          <div className="p-6">
            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="space-y-8">
                {/* Add Kumon Dollars Form */}
                <div className="bg-kumon-blue bg-opacity-10 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-kumon-blue mb-4 flex items-center">
                    <DollarSign className="mr-2" size={24} />
                    Add Kumon Dollars
                  </h3>
                  <form onSubmit={addKumonDollars} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                      required
                    >
                      <option value="">Select Student</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={dollarAmount}
                      onChange={(e) => setDollarAmount(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Description (e.g., Completed Level A)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                      required
                    />
                    <button type="submit" className="btn-primary">
                      Add Dollars
                    </button>
                  </form>
                </div>

                {/* Students List */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Student List</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map(student => (
                      <div key={student.id} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-bold text-gray-900">{student.name}</h4>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <p className="text-sm text-gray-600">Level: {student.level}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-lg">💰</span>
                          <span className="font-bold text-kumon-orange">{student.kumon_dollars}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Goals Tab */}
            {activeTab === 'goals' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Pending Goal Approvals</h3>
                {pendingGoals.length > 0 ? (
                  <div className="space-y-4">
                    {pendingGoals.map(goal => (
                      <div key={goal.id} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {goal.reward.image_url ? (
                              <img
                                src={goal.reward.image_url}
                                alt={goal.reward.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 text-xs">No Image</span>
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-gray-900">{goal.reward.name}</h4>
                              <p className="text-sm text-gray-600">
                                Student: {goal.student.name} ({goal.student.email})
                              </p>
                              <p className="text-sm text-gray-600">
                                Cost: {goal.reward.cost} Kumon Dollars
                              </p>
                              <p className="text-xs text-gray-500">
                                Requested: {new Date(goal.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {goal.goal_url && (
                            <div className="mt-2">
                              <a
                                href={goal.goal_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-kumon-blue underline break-all"
                              >
                                View Product Link
                              </a>
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => approveGoal(goal.id)}
                              className="flex items-center space-x-1 bg-kumon-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                            >
                              <Check size={16} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => rejectGoal(goal.id)}
                              className="flex items-center space-x-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                            >
                              <X size={16} />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500">No pending goals to review</p>
                  </div>
                )}
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Manage Rewards</h3>
                  <button
                    onClick={() => setShowAddReward(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Add Reward</span>
                  </button>
                </div>

                {/* Add/Edit Reward Form */}
                {showAddReward && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">
                      {editingReward ? 'Edit Reward' : 'Add New Reward'}
                    </h4>
                    <form onSubmit={saveReward} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Reward Name"
                          value={newReward.name}
                          onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Cost (Kumon Dollars)"
                          value={newReward.cost}
                          onChange={(e) => setNewReward({...newReward, cost: e.target.value})}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                          required
                        />
                      </div>
                      <textarea
                        placeholder="Description"
                        value={newReward.description}
                        onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                        rows={3}
                        required
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="image_url"
                          placeholder="Image URL (optional)"
                          value={newReward.image_url}
                          onChange={(e) => setNewReward({...newReward, image_url: e.target.value})}
                        />
                        <select
                          value={newReward.category}
                          onChange={(e) => setNewReward({...newReward, category: e.target.value})}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                        >
                          <option value="toys">Toys</option>
                          <option value="books">Books</option>
                          <option value="electronics">Electronics</option>
                          <option value="gift-cards">Gift Cards</option>
                          <option value="experiences">Experiences</option>
                        </select>
                      </div>
                      <div className="flex space-x-4">
                        <button 
                          type="submit" 
                          disabled={savingReward}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {savingReward && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          <span>{editingReward ? 'Update Reward' : 'Add Reward'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={savingReward}
                          onClick={() => {
                            setShowAddReward(false)
                            setEditingReward(null)
                            setNewReward({
                              name: '',
                              description: '',
                              cost: '',
                              image_url: '',
                              category: 'toys'
                            })
                          }}
                          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Rewards List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map(reward => (
                    <div key={reward.id} className="bg-gray-50 rounded-lg p-4">
                      {reward.image_url && (
                        <img
                          src={reward.image_url}
                          alt={reward.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h4 className="font-bold text-gray-900">{reward.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          <span className="text-lg">💰</span>
                          <span className="font-bold text-kumon-orange">{reward.cost}</span>
                        </div>
                        <span className="px-2 py-1 bg-kumon-blue bg-opacity-20 text-kumon-blue rounded text-xs">
                          {reward.category}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditReward(reward)}
                          className="flex-1 flex items-center justify-center space-x-1 bg-kumon-blue text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => deleteReward(reward.id)}
                          className="flex-1 flex items-center justify-center space-x-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}