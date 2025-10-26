import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { withRetry, isNetworkError, checkConnection } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Users, DollarSign, Target, Package, Plus, Check, X, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Student {
  id: string
  name: string
  email: string
  kumon_dollars: number
  grade: string
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
  description?: string
  amazon_link?: string
  cost: number
  image_url: string | null
  category: string
  available: boolean
}

export default function AdminDashboard() {
  const { user, userType } = useAuth()
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
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [savingStudent, setSavingStudent] = useState(false)

  // Form states
  const [selectedStudent, setSelectedStudent] = useState('')
  const [dollarAmount, setDollarAmount] = useState('')
  const [description, setDescription] = useState('')
  
  // Remove dollars form states
  const [selectedStudentRemove, setSelectedStudentRemove] = useState('')
  const [dollarAmountRemove, setDollarAmountRemove] = useState('')
  const [descriptionRemove, setDescriptionRemove] = useState('')
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    password: '',
    grade: 'Pre-K'
  })
  const [newReward, setNewReward] = useState({
    name: '',
    amazon_link: '',
    cost: '',
    image_url: '',
    category: 'toys'
  })

  useEffect(() => {
    fetchData()
    
    // Debug: Check if environment variables are loaded
    console.log('Environment check:', {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'loaded' : 'missing',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'loaded' : 'missing'
    })
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
          .select('id, email, name, kumon_dollars, grade')
          .order('email', { ascending: true })

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

        if (error) throw error
        return data
      })

      console.log('AdminDashboard: Students fetched successfully:', data?.length)
      setStudents(data.map((student: any) => ({
        id: student.id,
        name: student.name || `${student.email}`, // Fallback to email if name doesn't exist
        email: student.email,
        kumon_dollars: student.kumon_dollars || 0,
        grade: student.grade || 'Grade 1'
      })))
    } catch (error) {
      console.error('Failed to load students:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error loading students' 
        : 'Failed to load students'
      toast.error(errorMessage)
      // Don't throw error to prevent blocking other fetches
    }
  }

  // Get all students from database
  const getAllStudents = () => {
    return students
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
            goal_url,
            students (
              id,
              email,
              kumon_dollars
            ),
            rewards (
              id,
              name,
              cost,
              image_url,
              amazon_link
            )
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
        student: {
          name: goal.students?.name || goal.students?.email || 'Unknown Student',
          email: goal.students?.email || 'No email'
        },
        reward: {
          name: goal.rewards?.name || 'Unknown Reward',
          cost: goal.rewards?.cost || 0,
          image_url: goal.rewards?.image_url || null
        },
        goal_url: goal.goal_url
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

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

        if (error) throw error
        return data
      })

      console.log('AdminDashboard: Rewards fetched successfully:', data?.length)
      console.log('Raw rewards data:', data)
      
      if (!data || data.length === 0) {
        console.log('No rewards found in database')
        setRewards([])
        return
      }
      
      setRewards(data.map((reward: any) => ({
        id: reward.id,
        name: reward.name || 'Unknown Reward',
        description: reward.description || '',
        cost: reward.cost || 0,
        image_url: reward.image_url || null,
        category: reward.category || 'toys',
        available: reward.available !== false,
        amazon_link: reward.amazon_link || null
      })))
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
      
      // Update database student balance with retry
      await withRetry(async () => {
        const { error: updateError } = await supabase.rpc('add_kumon_dollars', {
          p_student_id: selectedStudent,
          p_amount: amount
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

  const removeKumonDollars = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentRemove || !dollarAmountRemove || !descriptionRemove) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const amount = parseInt(dollarAmountRemove)
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount (positive number)')
        return
      }
      
      // Update database student balance with retry
      await withRetry(async () => {
        const { error: updateError } = await supabase.rpc('remove_kumon_dollars', {
          p_student_id: selectedStudentRemove,
          p_amount: amount
        })

        if (updateError) throw updateError
      })

      // Add transaction record with retry
      await withRetry(async () => {
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            student_id: selectedStudentRemove,
            amount: amount,
            type: 'removed',
            description: descriptionRemove
          })

        if (transactionError) throw transactionError
      })
      
      toast.success('Kumon Dollars removed successfully!')
      setSelectedStudentRemove('')
      setDollarAmountRemove('')
      setDescriptionRemove('')
      
      // Refresh students list with retry
      try {
        await fetchStudents()
      } catch (error) {
        console.error('Failed to refresh students after removing dollars:', error)
        // Don't show error to user since the operation was successful
      }
    } catch (error) {
      console.error('Failed to remove Kumon Dollars:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error - please try again' 
        : error.message || 'Failed to remove Kumon Dollars'
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
    if (!newReward.name.trim() || !newReward.amazon_link.trim() || !newReward.cost) {
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
      // User is already authenticated and in AdminDashboard, so we can proceed
      console.log('Current user:', user?.id)
      console.log('User type:', userType)

      const rewardData = {
        name: newReward.name.trim(),
        amazon_link: newReward.amazon_link.trim(),
        cost: cost,
        image_url: newReward.image_url.trim() || null,
        category: newReward.category,
        available: true
      }

      console.log('Saving reward data:', rewardData)

      if (editingReward) {
        console.log('Updating existing reward:', editingReward.id)
        const { data, error } = await supabase
          .from('rewards')
          .update(rewardData)
          .eq('id', editingReward.id)
          .select()

        if (error) {
          console.error('Supabase update error:', error)
          throw error
        }
        
        console.log('Reward updated successfully:', data)
        toast.success('Reward updated!')
      } else {
        console.log('Creating new reward')
        const { data, error } = await supabase
          .from('rewards')
          .insert(rewardData)
          .select()

        if (error) {
          console.error('Supabase insert error:', error)
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
          throw error
        }
        
        console.log('Reward created successfully:', data)
        toast.success('Reward added!')
      }

      // Reset form
      setShowAddReward(false)
      setEditingReward(null)
      setNewReward({
        name: '',
        amazon_link: '',
        cost: '',
        image_url: '',
        category: 'toys'
      })

      // Refresh rewards list
      await fetchRewards()
    } catch (error) {
      console.error('Failed to save reward:', error)
      
      let errorMessage = 'Failed to save reward'
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error - please check your connection and try again'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out - please try again'
        } else if (error.message.includes('JWT') || error.message.includes('auth')) {
          errorMessage = 'Authentication error - please log in again'
        } else if (error.message.includes('database')) {
          errorMessage = 'Database connection error - please try again'
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = 'Permission denied - please check your admin access'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setSavingReward(false)
    }
  }

  const saveStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (savingStudent) return // Prevent multiple submissions
    
    // Validate form data
    if (!newStudent.firstName.trim() || !newStudent.lastName.trim() || 
        !newStudent.studentId.trim() || !newStudent.password.trim() || !newStudent.grade.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate password length
    if (newStudent.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    
    setSavingStudent(true)
    
    try {
      console.log('Creating new student:', newStudent)

      // Generate email from student ID
      const email = `${newStudent.studentId.toLowerCase()}@kumon.local`

      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: newStudent.password,
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          name: `${newStudent.firstName} ${newStudent.lastName}`,
          student_id: newStudent.studentId,
          grade: newStudent.grade
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        
        let errorMessage = 'Failed to create user account'
        if (authError.message.includes('already registered')) {
          errorMessage = 'A user with this email already exists'
        } else if (authError.message) {
          errorMessage = `Account creation error: ${authError.message}`
        }
        
        toast.error(errorMessage)
        return
      }

      console.log('Auth user created:', authData.user)

      // Insert student into database with the auth user ID
      const { data, error } = await supabase
        .from('students')
        .insert({
          id: authData.user.id, // Use the auth user ID
          name: `${newStudent.firstName} ${newStudent.lastName}`,
          email: email,
          kumon_dollars: 0,
          grade: newStudent.grade
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting student:', error)
        
        // If student creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id)
        
        let errorMessage = 'Failed to add student to database'
        if (error.code === '42501') {
          errorMessage = 'Permission denied - please check your admin access. Run the fix_user_id_invalid_error.sql script in Supabase.'
        } else if (error.code === '23505') {
          errorMessage = 'A student with this email already exists'
        } else if (error.message.includes('user id invalid') || error.message.includes('invalid user')) {
          errorMessage = 'User ID validation failed - please run the fix_user_id_invalid_error.sql script in Supabase SQL Editor'
        } else if (error.message.includes('policy') || error.message.includes('RLS')) {
          errorMessage = 'Row Level Security policy error - please run the fix_user_id_invalid_error.sql script in Supabase'
        } else if (error.message) {
          errorMessage = `Database error: ${error.message}`
        }
        
        toast.error(errorMessage)
        return
      }

      console.log('Student added to database:', data)
      
      // Refresh the students list to show the new student
      await fetchStudents()
      
      // Show success message
      toast.success('Student created successfully! They can now sign in with their email and password.')
      
      // Reset form
      setShowAddStudent(false)
      setNewStudent({
        firstName: '',
        lastName: '',
        studentId: '',
        password: '',
        grade: 'Pre-K'
      })

      // No need to refresh - student is already in localStudents state
    } catch (error) {
      console.error('Failed to create student:', error)
      
      let errorMessage = 'Failed to create student'
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error - please check your connection and try again'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out - please try again'
        } else if (error.message.includes('JWT') || error.message.includes('auth')) {
          errorMessage = 'Authentication error - please log in again'
        } else if (error.message.includes('database')) {
          errorMessage = 'Database connection error - please try again'
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = 'Permission denied - please run the fix_user_id_invalid_error.sql script in Supabase'
        } else if (error.message.includes('user id invalid') || error.message.includes('invalid user')) {
          errorMessage = 'User ID validation failed - please run the fix_user_id_invalid_error.sql script in Supabase SQL Editor'
        } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          errorMessage = 'A user with this email already exists'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setSavingStudent(false)
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
      amazon_link: reward.amazon_link || '',
      cost: reward.cost.toString(),
      image_url: reward.image_url || '',
      category: reward.category
    })
    setShowAddReward(true)
  }

  const removeStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student?')) return

    console.log('Attempting to remove student with ID:', studentId)

    try {
      console.log('Removing database student')
      // Remove from database
      const { data, error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .select()

      if (error) {
        console.error('Error deleting student from database:', error)
        toast.error(`Failed to remove student from database: ${error.message}`)
        return
      }

      console.log('Database delete result:', data)

      // Remove from local state
      setStudents(prev => {
        const newList = prev.filter(student => student.id !== studentId)
        console.log('Database students after removal:', newList)
        return newList
      })
      
      toast.success('Student removed successfully from database!')
    } catch (error) {
      console.error('Error removing student:', error)
      toast.error('Failed to remove student')
    }
  }

  const testSupabaseConnection = async () => {
    try {
      console.log('Testing Supabase connection...')
      
      // Test basic query
      const { data, error } = await supabase
        .from('rewards')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('Supabase test error:', error)
        toast.error(`Connection test failed: ${error.message}`)
        return false
      }
      
      console.log('Supabase test successful:', data)
      toast.success('Supabase connection working!')
      return true
    } catch (error) {
      console.error('Supabase test exception:', error)
      toast.error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
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
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  console.log('Testing connection...')
                  await testSupabaseConnection()
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Test Connection
              </button>
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
                      {getAllStudents().map(student => (
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

                {/* Remove Kumon Dollars Form */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center">
                    <DollarSign className="mr-2" size={24} />
                    Remove Kumon Dollars
                  </h3>
                  <form onSubmit={removeKumonDollars} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                      value={selectedStudentRemove}
                      onChange={(e) => setSelectedStudentRemove(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Student</option>
                      {getAllStudents().map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name} (${student.kumon_dollars})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Amount to Remove"
                      value={dollarAmountRemove}
                      onChange={(e) => setDollarAmountRemove(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Reason (e.g., Correction, Refund)"
                      value={descriptionRemove}
                      onChange={(e) => setDescriptionRemove(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                    <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors">
                      Remove Dollars
                    </button>
                  </form>
                </div>

                {/* Add Student Section */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-800 flex items-center">
                      <Users className="mr-2" size={24} />
                      Add New Student
                    </h3>
                    <button
                      onClick={() => setShowAddStudent(!showAddStudent)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {showAddStudent ? 'Cancel' : 'Add Student'}
                    </button>
                  </div>
                  
                  {showAddStudent && (
                    <form onSubmit={saveStudent} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={newStudent.firstName}
                          onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={newStudent.lastName}
                          onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Student ID"
                          value={newStudent.studentId}
                          onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                        <input
                          type="password"
                          placeholder="Password (min 6 characters)"
                          value={newStudent.password}
                          onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <select
                          value={newStudent.grade}
                          onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        >
                          <option value="Pre-K">Pre-K</option>
                          <option value="Kindergarten">Kindergarten</option>
                          <option value="Grade 1">Grade 1</option>
                          <option value="Grade 2">Grade 2</option>
                          <option value="Grade 3">Grade 3</option>
                          <option value="Grade 4">Grade 4</option>
                          <option value="Grade 5">Grade 5</option>
                          <option value="Grade 6">Grade 6</option>
                          <option value="Grade 7">Grade 7</option>
                          <option value="Grade 8">Grade 8</option>
                          <option value="Grade 9">Grade 9</option>
                          <option value="Grade 10">Grade 10</option>
                          <option value="Grade 11">Grade 11</option>
                          <option value="Grade 12">Grade 12</option>
                        </select>
                      </div>
                      <div className="flex space-x-4">
                        <button 
                          type="submit" 
                          disabled={savingStudent}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {savingStudent && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          <span>{savingStudent ? 'Adding Student...' : 'Add Student'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={savingStudent}
                          onClick={() => {
                            setShowAddStudent(false)
                            setNewStudent({
                              firstName: '',
                              lastName: '',
                              studentId: '',
                              password: '',
                              grade: 'Pre-K'
                            })
                          }}
                          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Students List */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Student List</h3>
                  
                  {/* Database Students */}
                  {students.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-700 mb-3">Active Students</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map(student => (
                          <div key={student.id} className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-bold text-gray-900">{student.name}</h4>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <p className="text-sm text-gray-500">{student.grade}</p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">💰</span>
                                <span className="font-bold text-kumon-orange">{student.kumon_dollars}</span>
                              </div>
                              <button
                                onClick={() => removeStudent(student.id)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                                title="Remove student"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  

                  
                  {students.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-500">No students found</p>
                    </div>
                  )}
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
                          type="text"
                          placeholder="Amazon Product Link"
                          value={newReward.amazon_link}
                          onChange={(e) => setNewReward({...newReward, amazon_link: e.target.value})}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="number"
                          placeholder="Cost (Kumon Dollars)"
                          value={newReward.cost}
                          onChange={(e) => setNewReward({...newReward, cost: e.target.value})}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          name="image_url"
                          placeholder="Image URL (optional)"
                          value={newReward.image_url}
                          onChange={(e) => setNewReward({...newReward, image_url: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              amazon_link: '',
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
                      <div 
                        className="cursor-pointer"
                        onClick={() => {
                          if (reward.amazon_link) {
                            window.open(reward.amazon_link, '_blank', 'noopener,noreferrer')
                          }
                        }}
                      >
                        {reward.image_url && (
                          <img
                            src={reward.image_url}
                            alt={reward.name}
                            className="w-full h-32 object-cover rounded-lg mb-3 hover:opacity-90 transition-opacity"
                          />
                        )}
                        <h4 className="font-bold text-gray-900 hover:text-kumon-blue transition-colors">
                          {reward.name}
                          {reward.amazon_link && (
                            <span className="ml-2 text-sm text-blue-600">🔗</span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                      </div>
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
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditReward(reward)
                          }}
                          className="flex-1 flex items-center justify-center space-x-1 bg-kumon-blue text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteReward(reward.id)
                          }}
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
