import React, { useState, useMemo } from 'react'
import { useQuestions } from '../context/QuestionContext'
import { Search, Plus, Edit, Trash2, Filter, Download, Upload, Settings, AlertTriangle, FileText, Database, BookOpen, Wrench } from 'lucide-react'
import QuestionForm from '../components/QuestionForm'

import QuestionDataTemplate from '../components/QuestionDataTemplate'
import ScenarioManagement from '../components/ScenarioManagement'
import QuestionBankImporter from '../components/QuestionBankImporter'

const QuestionBank = () => {
  const { questions, deleteQuestion, clearAllData, fixExistingQuestions, CAPABILITIES, CHANNELS } = useQuestions()
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterChannel, setFilterChannel] = useState('all')
  const [filterCapability, setFilterCapability] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')

  const [showScenarioManagement, setShowScenarioManagement] = useState(false)
  const [showQuestionBankImporter, setShowQuestionBankImporter] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesChannel = filterChannel === 'all' || question.channel === filterChannel
    const matchesCapability = filterCapability === 'all' || 
      (question.subCapability && question.subCapability.startsWith(filterCapability.split('.')[0] + '.'))
    const matchesDifficulty = filterDifficulty === 'all' || question.difficulty === filterDifficulty
    
    return matchesSearch && matchesChannel && matchesCapability && matchesDifficulty
  })

  const handleEdit = (question) => {
    setEditingQuestion(question)
    setShowForm(true)
  }

  const handleDelete = (questionId) => {
    if (window.confirm('确定要删除这道题目吗？')) {
      deleteQuestion(questionId)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingQuestion(null)
  }

  // 计算每种考核能力的题目数
  const capabilityStats = Object.keys(CAPABILITIES).reduce((acc, key) => {
    acc[key] = questions.filter(q => 
      q.subCapability && q.subCapability.startsWith(key + '.')
    ).length
    return acc
  }, {})

  const difficultyStats = {
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length
  }

  const handleClearDatabase = () => {
    // 管理员密码验证（简单示例，实际应用中应使用更安全的方式）
    const correctPassword = 'admin123'
    
    if (adminPassword === correctPassword) {
      clearAllData()
      setShowClearConfirm(false)
      setAdminPassword('')
      alert('题库已成功清空！')
    } else {
      alert('管理员密码错误！')
      setAdminPassword('')
    }
  }

  const handleFixExistingQuestions = () => {
    if (window.confirm('确定要修复现有题目数据吗？这将为缺失 questionType 字段的题目添加该字段。')) {
      try {
        fixExistingQuestions()
        alert('题目数据修复完成！请查看控制台了解详细信息。')
      } catch (error) {
        console.error('修复题目数据时出错:', error)
        alert('修复题目数据时出错，请查看控制台了解详细信息。')
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">题库管理</h1>
          <p className="text-gray-600 mt-2">管理可口可乐销售能力评估题目</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowClearConfirm(true)}
            className="btn-danger flex items-center space-x-2"
          >
            <AlertTriangle size={20} />
            <span>一键清空题库</span>
          </button>
          <button 
            onClick={handleFixExistingQuestions}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Wrench size={20} />
            <span>修复题目数据</span>
          </button>
          <button 
            onClick={() => setShowScenarioManagement(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <FileText size={20} />
            <span>场景管理</span>
          </button>
          <button 
            onClick={() => setShowQuestionBankImporter(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Database size={20} />
            <span>完整题库导入</span>
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>添加题目</span>
          </button>
        </div>
      </div>

      {/* 统计卡片 - 修改为考核能力统计 */}
      <div className="grid grid-cols-1 gap-4">
        {/* 总题目数 */}
        <div className="card">
          <div className="flex items-center space-x-3">
            <BookOpen className="text-coca-red" size={24} />
            <div>
              <p className="text-2xl font-bold">{questions.length}</p>
              <p className="text-gray-600 text-sm">总题目</p>
            </div>
          </div>
        </div>
        
        {/* 考核能力分布 */}
        <div className="card">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-800 border-l-4 border-coca-red pl-3">
              考核能力分布
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(CAPABILITIES).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-lg font-bold text-coca-red">
                    {capabilityStats[key] || 0}
                  </div>
                  <div className="text-xs text-gray-600 leading-tight">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索题目内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="input-field"
          >
            <option value="all">所有渠道</option>
            {Object.entries(CHANNELS).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>

          <select
            value={filterCapability}
            onChange={(e) => setFilterCapability(e.target.value)}
            className="input-field"
          >
            <option value="all">所有考察能力</option>
            {Object.entries(CAPABILITIES).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
          
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="input-field"
          >
            <option value="all">所有难度</option>
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
      </div>

      {/* 题目列表 */}
      <div className="space-y-4">
        {filteredQuestions.map((question, index) => (
          <div key={question.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    {CHANNELS[question.channel] || question.channel}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    question.difficulty === 'easy' 
                      ? 'bg-green-100 text-green-800'
                      : question.difficulty === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {question.difficulty === 'easy' ? '简单' : 
                     question.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                  {question.competency && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {question.competency}
                    </span>
                  )}
                  {question.subCompetency && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      {question.subCompetency}
                    </span>
                  )}
                  {question.isMultipleChoice && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-pink-100 text-pink-800">
                      多选题
                    </span>
                  )}
                  {question.scenarioTitle && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      {CHANNELS[question.channel] || question.channel}场景{question.scenarioOrder || ''}
                    </span>
                  )}
                </div>
                
                <h3 className="font-medium text-gray-800 mb-3">{question.content}</h3>
                
                <div className="space-y-1 mb-3">
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = question.isMultipleChoice 
                      ? question.correctAnswers && question.correctAnswers.includes(optionIndex)
                      : optionIndex === question.correctAnswer;
                    
                    return (
                      <div 
                        key={optionIndex} 
                        className={`text-sm p-2 rounded ${
                          isCorrect
                            ? 'bg-green-50 text-green-800 border border-green-200' 
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {String.fromCharCode(65 + optionIndex)}. {option}
                        {isCorrect && (
                          <span className="ml-2 text-green-600 font-medium">✓ 正确答案</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {question.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-800">
                      <strong>解析：</strong>{question.explanation}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(question)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="编辑"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(question.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="删除"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>没有找到匹配的题目</p>
          </div>
        )}
      </div>

      {/* 题目表单模态框 */}
      {showForm && (
        <QuestionForm 
          question={editingQuestion}
          onClose={handleCloseForm}
        />
      )}

      {/* 场景管理模态框 */}
      {showScenarioManagement && (
        <ScenarioManagement 
          onClose={() => setShowScenarioManagement(false)}
        />
      )}

      {/* 完整题库导入模态框 */}
      {showQuestionBankImporter && (
        <QuestionBankImporter 
          onClose={() => setShowQuestionBankImporter(false)}
        />
      )}

      {/* 一键清空确认对话框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="text-red-500" size={24} />
                <h3 className="text-lg font-bold text-gray-800">确认清空题库</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                此操作将删除所有题目和场景数据，且无法恢复。请输入管理员密码确认：
              </p>
              
              <input
                type="password"
                placeholder="请输入管理员密码"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="input-field w-full mb-4"
                onKeyPress={(e) => e.key === 'Enter' && handleClearDatabase()}
              />
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowClearConfirm(false)
                    setAdminPassword('')
                  }}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleClearDatabase}
                  className="btn-danger"
                >
                  确认清空
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionBank