import React, { useState } from 'react'
import { useQuestions } from '../context/QuestionContext'
import { Plus, Edit, Trash2, Save, X, FileText } from 'lucide-react'

const ScenarioManagement = ({ onClose }) => {
  const { scenarios, addScenario, updateScenario, deleteScenario } = useQuestions()
  const [editingScenario, setEditingScenario] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    questionRange: [1, 5]
  })

  const handleEdit = (scenario) => {
    setEditingScenario(scenario)
    setFormData({
      title: scenario.title,
      content: scenario.description || scenario.content || '',
      questionRange: scenario.questionRange || [1, 5]
    })
    setShowForm(true)
  }

  const handleDelete = (scenarioId) => {
    if (window.confirm('确定要删除这个场景吗？')) {
      deleteScenario(scenarioId)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('请填写场景标题和内容')
      return
    }

    if (editingScenario) {
      updateScenario(editingScenario.id, formData)
    } else {
      addScenario(formData)
    }

    setShowForm(false)
    setEditingScenario(null)
    setFormData({ title: '', content: '', questionRange: [1, 5] })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingScenario(null)
    setFormData({ title: '', content: '', questionRange: [1, 5] })
  }

  const handleAddNew = () => {
    setEditingScenario(null)
    setFormData({ title: '', content: '', questionRange: [1, 5] })
    setShowForm(true)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FileText className="text-coca-red" size={24} />
              <h2 className="text-xl font-bold text-gray-800">场景管理</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {!showForm ? (
            <>
              {/* 添加按钮 */}
              <div className="mb-6">
                <button
                  onClick={handleAddNew}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>添加新场景</span>
                </button>
              </div>

              {/* 场景列表 */}
              <div className="space-y-4">
                {scenarios && scenarios.map((scenario) => (
                  <div key={scenario.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-medium text-gray-800">{scenario.title}</h3>
                          {scenario.questionRange && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              第 {scenario.questionRange[0]}-{scenario.questionRange[1]} 题
                            </span>
                          )}
                          {scenario.channel && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                              {scenario.channel}
                            </span>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {scenario.description || scenario.content || '暂无描述'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(scenario)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(scenario.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {(!scenarios || scenarios.length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>暂无场景数据</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* 场景表单 */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  场景标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  placeholder="例如：场景1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  题目范围
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">起始题号</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={formData.questionRange[0]}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        questionRange: [parseInt(e.target.value), prev.questionRange[1]]
                      }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">结束题号</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={formData.questionRange[1]}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        questionRange: [prev.questionRange[0], parseInt(e.target.value)]
                      }))}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  场景内容 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="input-field h-48 resize-none"
                  placeholder="请输入详细的场景描述..."
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save size={20} />
                  <span>{editingScenario ? '更新场景' : '添加场景'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScenarioManagement