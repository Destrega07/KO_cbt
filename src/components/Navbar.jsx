import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Database, Home, FileText } from 'lucide-react'
import CocaColaBottleCap from './CocaColaBottleCap'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user || location.pathname === '/login') {
    return null
  }

  return (
    <nav className="navbar">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <CocaColaBottleCap size={32} />
              </div>
              <span className="text-xl font-bold text-gray-800">可口可乐评估系统</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-gray-600 hover:text-coca-red transition-colors"
              >
                <Home size={18} />
                <span>首页</span>
              </Link>
              
              {isAdmin && (
                <Link 
                  to="/question-bank" 
                  className="flex items-center space-x-2 text-gray-600 hover:text-coca-red transition-colors"
                >
                  <Database size={18} />
                  <span>题库管理</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user.name}</span>
              <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                {isAdmin ? '管理员' : '用户'}
              </span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-coca-red transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar