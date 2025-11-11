import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('coca_cola_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (credentials) => {
    // 模拟登录验证
    const { username, password } = credentials
    
    // 管理员账户
    if (username === 'admin' && password === 'admin123') {
      const adminUser = {
        id: 'admin',
        username: 'admin',
        name: '系统管理员',
        role: 'admin'
      }
      setUser(adminUser)
      localStorage.setItem('coca_cola_user', JSON.stringify(adminUser))
      return { success: true }
    }
    
    // 普通用户账户 (可以添加更多用户)
    if (username === 'sales' && password === 'sales123') {
      const salesUser = {
        id: 'sales1',
        username: 'sales',
        name: '销售人员',
        role: 'user'
      }
      setUser(salesUser)
      localStorage.setItem('coca_cola_user', JSON.stringify(salesUser))
      return { success: true }
    }
    
    return { success: false, message: '用户名或密码错误' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('coca_cola_user')
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}