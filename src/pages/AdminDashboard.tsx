import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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
    image_url: string
  }
}

interface Reward {
  id: string
  name: string
  description: string
  cost: number
  image_url: string
  category: string
  available: boolean
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('students')
  const [students, setStudents] = useState<Student[]>([])
  const [pendingGoals, setPendingGoals] = useState<Goal[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddReward, setShowAddReward] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)

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

  const fetchData = async () => {
    await Promise.all([
      fetchStudents(),
      fetchPendingGoals(),
      fetchRewards()
    ])
    setLoading(false)
  }

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name')

      if (error) throw error
      setStudents(data)
    } catch (error) {
      toast.error('Failed to load students')
    }
  }

  const fetchPendingGoals = async () => {
    try {
      const { data, error } = await supabase
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
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPendingGoals(data.map(goal => ({
        id: goal.id,
        status: goal.status,
        created_at: goal.created_at,
        student: goal.students as any,
        reward: goal.rewards as any
      })))
    } catch (error) {
      toast.error('Failed to load pending goals')
    }
  }

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('name')

      if (error) throw error
      setRewards(data)
    } catch (error) {
      toast.error('Failed to load rewards')
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
      
      // Update student balance
      const { error: updateError } = await supabase.rpc('add_kumon_dollars', {
        student_id: selectedStudent,
        amount: amount
      })

      if (updateError) throw updateError

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          student_id: selectedStudent,
          amount: amount,
          type: 'earned',
          description: description
        })

      if (transactionError) throw transactionError

      toast.success('Kumon Dollars added successfully!')
      setSelectedStudent('')
      setDollarAmount('')
      setDescription('')
      fetchStudents()
    } catch (error) {
      toast.error('Failed to add Kumon Dollars')
    }
  }

  const approveGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ status: 'approved' })
        .eq('id', goalId)

      if (error) throw error
      toast.success('Goal approved!')
      fetchPendingGoals()
    } catch (error) {
      toast.error('Failed to approve goal')
    }
  }

  const rejectGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ status: 'rejected' })
        .eq('id', goalId)

      if (error) throw error
      toast.success('Goal rejected')
      fetchPendingGoals()
    } catch (error) {
      toast.error('Failed to reject goal')
    }
  }

  const saveReward = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const rewardData = {
        name: newReward.name,
        description: newReward.description,
        cost: parseInt(newReward.cost),
        image_url: newReward.image_url,
        category: newReward.category,
        available: true
      }

      if (editingReward) {
        const { error } = await supabase
          .from('rewards')
          .update(rewardData)
          .eq('id', editingReward.id)

        if (error) throw error
        toast.success('Reward updated!')
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert(rewardData)

        if (error) throw error
        toast.success('Reward added!')
      }

      setShowAddReward(false)
      setEditingReward(null)
      setNewReward({
        name: '',
        description: '',
        cost: '',
        image_url: '',
        category: 'toys'
      })
      fetchRewards()
    } catch (error) {
      toast.error('Failed to save reward')
    }
  }

  const deleteReward = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return

    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', rewardId)

      if (error) throw error
      toast.success('Reward deleted')
      fetchRewards()
    } catch (error) {
      toast.error('Failed to delete reward')
    }
  }

  const startEditReward = (reward: Reward) => {
    setEditingReward(reward)
    setNewReward({
      name: reward.name,
      description: reward.description,
      cost: reward.cost.toString(),
      image_url: reward.image_url,
      category: reward.category
    })
    setShowAddReward(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kumon-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">👨‍🏫 Admin Dashboard</h1>
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
                            <img
                              src={goal.reward.image_url}
                              alt={goal.reward.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
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
                          type="url"
                          placeholder="Image URL"
                          value={newReward.image_url}
                          onChange={(e) => setNewReward({...newReward, image_url: e.target.value})}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                          required
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
                        <button type="submit" className="btn-primary">
                          {editingReward ? 'Update Reward' : 'Add Reward'}
                        </button>
                        <button
                          type="button"
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
                          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                      <img
                        src={reward.image_url}
                        alt={reward.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
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