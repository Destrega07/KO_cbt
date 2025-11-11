import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle } from 'lucide-react'
import { useQuestions } from '../context/QuestionContext'
import TestUserInfoModal from '../components/TestUserInfoModal'

function Quiz() {
  const { quizId } = useParams() // 修改：使用quizId而不是id
  const navigate = useNavigate()
  const { getQuiz, submitQuiz, generatePersonalizedTest } = useQuestions()
  
  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(3600) // 60分钟
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showUserInfoModal, setShowUserInfoModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (quizId === 'new') { // 修改：使用quizId
      setShowUserInfoModal(true)
    } else {
      const quizData = getQuiz(quizId) // 修改：使用quizId
      if (quizData) {
        setQuiz(quizData)
        // 初始化答案状态
        const initialAnswers = {}
        quizData.questions.forEach((question, index) => {
          // 根据题目类型初始化答案
          if (question.isMultipleChoice) {
            initialAnswers[index] = [] // 多选题用数组
          } else {
            initialAnswers[index] = null // 单选题用null
          }
        })
        setAnswers(initialAnswers)
      }
    }
  }, [quizId, getQuiz]) // 修改：使用quizId

  useEffect(() => {
    if (quiz && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // 时间到，自动提交
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [quiz, timeRemaining])

  const handleUserInfoSubmit = async (userInfo) => {
    setUser(userInfo)
    setLoading(true)
    setError(null)
    
    try {
      const personalizedTest = await generatePersonalizedTest(userInfo)
      setQuiz(personalizedTest)
      
      // 初始化答案状态
      const initialAnswers = {}
      personalizedTest.questions.forEach((question, index) => {
        // 根据题目类型初始化答案
        if (question.isMultipleChoice) {
          initialAnswers[index] = [] // 多选题用数组
        } else {
          initialAnswers[index] = null // 单选题用null
        }
      })
      setAnswers(initialAnswers)
      
      setShowUserInfoModal(false)
      
      // 更新URL为实际的测验ID
      navigate(`/quiz/${personalizedTest.id}`, { replace: true })
      
    } catch (error) {
      console.error('生成测验失败:', error)
      setError(`生成测验失败：${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex) => {
    const currentQ = quiz.questions[currentQuestion]
    
    if (currentQ.isMultipleChoice) {
      // 多选题逻辑
      setAnswers(prev => {
        const currentAnswers = prev[currentQuestion] || []
        const newAnswers = [...currentAnswers]
        
        if (newAnswers.includes(answerIndex)) {
          // 如果已选中，则取消选择
          const index = newAnswers.indexOf(answerIndex)
          newAnswers.splice(index, 1)
        } else {
          // 如果未选中，则添加选择
          newAnswers.push(answerIndex)
        }
        
        return {
          ...prev,
          [currentQuestion]: newAnswers
        }
      })
    } else {
      // 单选题逻辑
      setAnswers(prev => ({
        ...prev,
        [currentQuestion]: answerIndex
      }))
    }
  }

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleQuestionSelect = (questionIndex) => {
    setCurrentQuestion(questionIndex)
  }

  const handleSubmitQuiz = () => {
    const answerArray = Object.keys(answers).map(key => answers[key])
    const result = submitQuiz(quiz.id, answerArray, user?.id)
    if (result) {
      navigate(`/results/${result.id}`)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 获取题目类型标识
  const getQuestionTypeInfo = (questionIndex) => {
    const question = quiz.questions[questionIndex]
    if (questionIndex < 30) {
      const baseInfo = { type: '场景题', color: 'bg-blue-100 text-blue-800' }
      if (question?.isMultipleChoice) {
        return { ...baseInfo, type: '场景题 · 多选题' }
      }
      return baseInfo
    } else if (questionIndex < 40) {
      const baseInfo = { type: '渠道题', color: 'bg-green-100 text-green-800' }
      if (question?.isMultipleChoice) {
        return { ...baseInfo, type: '渠道题 · 多选题' }
      }
      return baseInfo
    } else {
      const baseInfo = { type: '通用题', color: 'bg-purple-100 text-purple-800' }
      if (question?.isMultipleChoice) {
        return { ...baseInfo, type: '通用题 · 多选题' }
      }
      return baseInfo
    }
  }

  // 检查题目是否已答
  const isQuestionAnswered = (questionIndex) => {
    const answer = answers[questionIndex]
    const question = quiz.questions[questionIndex]
    
    if (question?.isMultipleChoice) {
      return Array.isArray(answer) && answer.length > 0
    } else {
      return answer !== null && answer !== undefined
    }
  }

  const answeredCount = quiz ? quiz.questions.filter((_, index) => isQuestionAnswered(index)).length : 0
  const progress = (answeredCount / (quiz?.questions.length || 1)) * 100

  // 用户信息录入弹窗
  if (showUserInfoModal) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">可口可乐能力测评</h1>
            <p className="text-gray-600">请填写您的基本信息开始测试</p>
          </div>
        </div>
        
        <TestUserInfoModal
          onClose={() => navigate('/')}
          onSubmit={handleUserInfoSubmit}
        />
        
        {error && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="text-red-500" size={24} />
                <h3 className="text-lg font-medium text-gray-800">生成测验失败</h3>
              </div>
              <div className="text-gray-600 mb-6 whitespace-pre-line">
                {error}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setError(null)}
                  className="btn-secondary"
                >
                  重试
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="btn-primary"
                >
                  返回首页
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coca-red mx-auto mb-4"></div>
          <p className="text-gray-600">正在生成个性化测验...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">测验不存在或已被删除</p>
      </div>
    )
  }

  const currentQ = quiz.questions[currentQuestion]
  const currentScenario = currentQ?.scenarioInfo
  const questionTypeInfo = getQuestionTypeInfo(currentQuestion)

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* 顶部状态栏 */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Clock className="text-coca-red" size={20} />
              <span className="font-mono text-lg font-medium">
                {formatTime(timeRemaining)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Flag size={20} className="text-gray-500" />
              <span className="text-gray-700">
                已答题: {answeredCount} / {quiz.questions.length}
              </span>
            </div>

            {/* 用户信息显示 */}
            {quiz.userInfo && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>姓名: {quiz.userInfo.name}</span>
                <span>渠道: {quiz.userInfo.channel}</span>
                <span>职级: {quiz.userInfo.position}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="btn-primary"
            disabled={answeredCount === 0}
          >
            提交答案
          </button>
        </div>

        {/* 进度条 */}
        <div className="mt-4">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            完成进度: {progress.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 题目导航 */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h3 className="font-medium text-gray-800 mb-4">题目导航</h3>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {quiz.questions.map((_, index) => {
                const typeInfo = getQuestionTypeInfo(index)
                return (
                  <button
                    key={index}
                    onClick={() => handleQuestionSelect(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors relative ${
                      index === currentQuestion
                        ? 'bg-coca-red text-white'
                        : isQuestionAnswered(index)
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={`第${index + 1}题 - ${typeInfo.type}`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
            
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-coca-red rounded"></div>
                <span>当前题目</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>已答题目</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                <span>未答题目</span>
              </div>
            </div>

            {/* 题目类型说明 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-xs font-medium text-gray-700 mb-2">题目类型</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>场景题</span>
                  <span className="text-gray-500">1-30题</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>渠道题</span>
                  <span className="text-gray-500">31-40题</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>通用题</span>
                  <span className="text-gray-500">41-60题</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 题目内容 */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* 场景说明 */}
            {currentScenario && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-800 mb-2">
                  {currentScenario.title}
                </h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  {currentScenario.description}
                </p>
              </div>
            )}

            {/* 题目信息 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-gray-800">
                  第 {currentQuestion + 1} 题 / 共 {quiz.questions.length} 题
                </h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${questionTypeInfo.color}`}>
                  {questionTypeInfo.type}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {/* 只保留能力标签，隐藏难度和场景类型 */}
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {currentQ.capability}
                </span>
              </div>
            </div>

            {/* 题目内容 */}
            <div className="mb-6">
              <p className="text-gray-800 leading-relaxed text-lg">
                {currentQ.content}
              </p>
            </div>

            {/* 选项 */}
            <div className="space-y-3 mb-8">
              {currentQ.options.map((option, index) => {
                const isSelected = currentQ.isMultipleChoice 
                  ? (answers[currentQuestion] || []).includes(index)
                  : answers[currentQuestion] === index
                
                return (
                  <label
                    key={index}
                    className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-coca-red bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type={currentQ.isMultipleChoice ? "checkbox" : "radio"}
                        name={`question-${currentQuestion}`}
                        value={index}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(index)}
                        className="mt-1 text-coca-red focus:ring-coca-red"
                      />
                      <span className="text-gray-800 leading-relaxed">
                        {String.fromCharCode(65 + index)}. {option}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* 导航按钮 */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
                <span>上一题</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentQuestion === quiz.questions.length - 1}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>下一题</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 提交确认对话框 */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-800 mb-4">确认提交答案</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">总题目数:</span>
                <span className="font-medium">{quiz.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">已答题目:</span>
                <span className="font-medium text-green-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">未答题目:</span>
                <span className="font-medium text-red-600">{quiz.questions.length - answeredCount}</span>
              </div>
            </div>

            {answeredCount < quiz.questions.length && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-yellow-800 text-sm">
                  您还有 {quiz.questions.length - answeredCount} 道题未作答，确定要提交吗？
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="btn-secondary"
              >
                继续答题
              </button>
              <button
                onClick={handleSubmitQuiz}
                className="btn-primary"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Quiz