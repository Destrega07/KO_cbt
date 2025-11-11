import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { QuestionProvider } from './context/QuestionContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import QuestionBank from './pages/QuestionBank'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import Review from './pages/Review'
import ProtectedRoute from './components/ProtectedRoute'

// 题库导入脚本已移除，避免启动时的错误

function App() {
  return (
    <AuthProvider>
      <QuestionProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/question-bank" element={
                <ProtectedRoute adminOnly>
                  <QuestionBank />
                </ProtectedRoute>
              } />
              <Route path="/quiz/:quizId" element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              } />
              <Route path="/results/:resultId" element={
                <ProtectedRoute>
                  <Results />
                </ProtectedRoute>
              } />
              <Route path="/review/:resultId" element={
                <ProtectedRoute>
                  <Review />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </QuestionProvider>
    </AuthProvider>
  )
}

export default App