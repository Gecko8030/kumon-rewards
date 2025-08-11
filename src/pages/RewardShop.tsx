import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { withRetry, isNetworkError } from '../lib/api'
import { Search, Filter, Target } from 'lucide-react'
import toast from 'react-hot-toast'

interface Reward {
  id: string
  name: string
  description: string
  cost: number
  image_url: string | null
  category: string
  available: boolean
}

export default function RewardShop() {
  const { user, userType, loading: authLoading } = useAuth()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionVerified, setSessionVerified] = useState(false)
  const [goalUrl, setGoalUrl] = useState('');

  const categories = ['all', 'toys', 'books', 'electronics', 'gift-cards', 'experiences']
  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-50', label: '0-50 Dollars' },
    { value: '51-100', label: '51-100 Dollars' },
    { value: '101-200', label: '101-200 Dollars' },
    { value: '201+', label: '201+ Dollars' }
  ]

  // Verify session and role on mount and when auth state changes
  useEffect(() => {
    const verifySessionAndRole = async () => {
      if (authLoading) return

      try {
        // Check if user is authenticated (optional for shop - can be viewed by anyone)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session verification failed:', sessionError)
          // Don't block shop access for session errors
        }

        console.log('Session verified for shop access')
        setSessionVerified(true)
        
        // Fetch data only after session is verified
        await fetchRewards()
        
      } catch (error) {
        console.error('Session verification error:', error)
        // Don't block shop access for session errors
        setSessionVerified(true)
        await fetchRewards()
      }
    }

    verifySessionAndRole()
  }, [user, userType, authLoading])

  useEffect(() => {
    filterRewards()
  }, [rewards, searchTerm, selectedCategory, priceRange])

  const fetchRewards = async () => {
    try {
      console.log('Fetching rewards...')
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('rewards')
          .select('*')
          .eq('available', true)
          .order('cost', { ascending: true })

        if (error) {
          console.error('Rewards fetch error:', error)
          throw error
        }
        return data
      })

      console.log('Rewards fetched successfully:', data?.length)
      setRewards(data)
    } catch (error) {
      console.error('Failed to load rewards:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error - please check your connection' 
        : 'Failed to load rewards'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filterRewards = () => {
    let filtered = rewards

    if (searchTerm) {
      filtered = filtered.filter(reward =>
        reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(reward => reward.category === selectedCategory)
    }

    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(p => p.replace('+', ''))
      filtered = filtered.filter(reward => {
        if (priceRange === '201+') return reward.cost >= 201
        return reward.cost >= parseInt(min) && reward.cost <= parseInt(max)
      })
    }

    setFilteredRewards(filtered)
  }

  const setAsGoal = async (rewardId: string) => {
    if (!user || userType !== 'student') {
      toast.error('Please log in as a student to set goals')
      return
    }

    try {
      console.log('Setting goal for reward:', rewardId)
      
      // Check for existing goals with retry
      const { data: existingGoal } = await withRetry(async () => {
        const { data, error } = await supabase
          .from('goals')
          .select('id')
          .eq('student_id', user.id)
          .in('status', ['pending', 'approved'])
          .single()
        
        if (error && error.code !== 'PGRST116') {
          throw error
        }
        return { data, error }
      })

      if (existingGoal) {
        toast.error('You already have an active goal. Complete it first!')
        return
      }

      // Create new goal with retry
      await withRetry(async () => {
        const { error } = await supabase
          .from('goals')
          .insert({
            student_id: user.id,
            reward_id: rewardId,
            status: 'pending',
            goal_url: goalUrl || null
          })

        if (error) {
          console.error('Goal creation error:', error)
          throw error
        }
      })
      
      setGoalUrl('');
      console.log('Goal set successfully')
      toast.success('Goal set! Waiting for instructor approval.')
    } catch (error) {
      console.error('Failed to set goal:', error)
      const errorMessage = isNetworkError(error) 
        ? 'Network error - please check your connection and try again' 
        : 'Failed to set goal. Please try again.';
      toast.error(errorMessage)
    }
  }

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && sessionVerified) {
        console.warn('Reward shop loading timeout reached')
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Reward Shop</h2>
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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎁 Reward Shop</h1>
          <p className="text-xl text-white">Choose your next goal and start saving!</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl card-shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search rewards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent appearance-none"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
            >
              {priceRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rewards Grid */}
        {filteredRewards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRewards.map((reward) => (
              <div key={reward.id} className="bg-white rounded-2xl card-shadow overflow-hidden transform hover:scale-105 transition-all duration-300">
                <div className="aspect-w-1 aspect-h-1">
                  {reward.image_url ? (
                    <img
                      src={reward.image_url}
                      alt={reward.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{reward.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{reward.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-2xl">💰</span>
                      <span className="text-2xl font-bold text-kumon-orange">{reward.cost}</span>
                      <span className="text-sm text-gray-600">Dollars</span>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{reward.category}</span>
                  </div>

                  {user && userType === 'student' && (
                    <>
                      <div className="mb-2">
                        <input
                          type="url"
                          placeholder="Optional: Paste Amazon or product link as your goal"
                          value={goalUrl}
                          onChange={e => setGoalUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-kumon-blue focus:border-transparent"
                          pattern="https?://.*"
                        />
                      </div>
                      <button
                        onClick={() => setAsGoal(reward.id)}
                        className="w-full btn-primary flex items-center justify-center space-x-2"
                      >
                        <Target size={16} />
                        <span>Set as Goal</span>
                      </button>
                    </>
                  )}

                  {!user && (
                    <div className="text-center text-sm text-gray-500">
                      <p>Log in as a student to set goals</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl card-shadow p-8">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No rewards found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
