import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Star, Gift, Trophy, Target, LineChart } from 'lucide-react'

export default function Home() {
  const { user, userType } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-kumon-blue via-kumon-purple to-kumon-pink">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-6">
              Welcome to Kumon Bentonville Rewards! 🌟
            </h1>
            <p className="text-2xl text-white mb-8 max-w-3xl mx-auto">
              Earn Kumon Dollars, set goals, and get amazing rewards for your hard work and learning!
            </p>
            
            {!user && (
              <div className="space-x-4">
                <Link to="/login" className="btn-primary text-xl px-8 py-4">
                  Get Started
                </Link>
                <Link to="/shop" className="btn-secondary text-xl px-8 py-4">
                  Browse Rewards
                </Link>
              </div>
            )}
            
            {user && userType === 'student' && (
              <div className="space-x-4">
                <Link to="/dashboard" className="btn-primary text-xl px-8 py-4">
                  My Dashboard
                </Link>
              </div>
            )}
            
            {user && userType === 'admin' && (
              <Link to="/admin" className="btn-primary text-xl px-8 py-4">
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 star-animation">
          <Star className="text-kumon-yellow" size={40} />
        </div>
        <div className="absolute top-32 right-20 star-animation" style={{ animationDelay: '0.5s' }}>
          <Gift className="text-kumon-orange" size={35} />
        </div>
        <div className="absolute bottom-20 left-20 star-animation" style={{ animationDelay: '1s' }}>
          <Trophy className="text-kumon-green" size={45} />
        </div>
        <div className="absolute bottom-32 right-10 star-animation" style={{ animationDelay: '1.5s' }}>
          <Target className="text-kumon-pink" size={38} />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Learning is fun when you have goals to work toward!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-kumon-blue to-blue-600 rounded-2xl card-shadow text-white transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Learn & Study</h3>
              <p>Complete your Kumon worksheets and show your progress to earn Kumon Dollars!</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-kumon-orange to-orange-600 rounded-2xl card-shadow text-white transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Earn Dollars</h3>
              <p>Get Kumon Dollars added to your account by your instructor for good work!</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-kumon-green to-green-600 rounded-2xl card-shadow text-white transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Set Goals</h3>
              <p>Choose a reward from our shop and set it as your goal to work toward!</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-kumon-purple to-purple-600 rounded-2xl card-shadow text-white transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎁</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Get Rewards</h3>
              <p>When you have enough Kumon Dollars, claim your reward and celebrate!</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Kumon Section */}
      <div className="py-20 bg-gradient-to-r from-kumon-yellow to-kumon-orange">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-8">About Kumon</h2>
            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 card-shadow">
              <p className="text-lg text-gray-700 mb-6">
                Kumon is a learning method that develops children's potential by advancing their study ability through individualized instruction. Our reward system makes learning even more exciting by giving students goals to work toward!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl mb-2">🧠</div>
                  <h3 className="font-bold text-kumon-blue mb-2">Self-Learning</h3>
                  <p className="text-gray-600">Develop independent study skills</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">📈</div>
                  <h3 className="font-bold text-kumon-blue mb-2">Progress Tracking</h3>
                  <p className="text-gray-600">Monitor your improvement over time</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">🏆</div>
                  <h3 className="font-bold text-kumon-blue mb-2">Achievement</h3>
                  <p className="text-gray-600">Celebrate your learning milestones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

