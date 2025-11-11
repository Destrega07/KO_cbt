import React, { useState, useEffect } from 'react'
import { useQuestions } from '../context/QuestionContext'
import { X, Plus, Trash2, Minus } from 'lucide-react'

// 考察能力选项
const competencyOptions = [
  { value: '', label: '请选择考察能力' },
  { value: '1.全域洞察力', label: '1.全域洞察力' },
  { value: '2.方案规划力', label: '2.方案规划力' },
  { value: '3.故事沟通力', label: '3.故事沟通力' },
  { value: '4.卖进谈判力', label: '4.卖进谈判力' },
  { value: '5.客户发展力', label: '5.客户发展力' },
  { value: '6.卓越执行力', label: '6.卓越执行力' },
  { value: '7.战略领导力', label: '7.战略领导力' }
]

// 获取子能力项选项
const getSubCompetencyOptions = (competency) => {
  const subCompetencyMap = {
    '1.全域洞察力': [
      { value: '1.1 从数据到洞察', label: '1.1 从数据到洞察' },
      { value: '1.2 品类分析应用', label: '1.2 品类分析应用' }
    ],
    '2.方案规划力': [
      { value: '2.1 渠道解决方案', label: '2.1 渠道解决方案' },
      { value: '2.2.1 收益管理', label: '2.2.1 收益管理' },
      { value: '2.2.2 整合营销规划', label: '2.2.2 整合营销规划' },
      { value: '2.2.3 供应链管理', label: '2.2.3 供应链管理' },
      { value: '2.2.4 O2O管理', label: '2.2.4 O2O管理' },
      { value: '2.2.5 财务解决方案', label: '2.2.5 财务解决方案' },
      { value: '2.3 客户生意规划', label: '2.3 客户生意规划' },
      { value: '2.4 财务敏锐度', label: '2.4 财务敏锐度' }
    ],
    '3.故事沟通力': [
      { value: '3.1 高效沟通技巧', label: '3.1 高效沟通技巧' },
      { value: '3.2 讲述价值故事', label: '3.2 讲述价值故事' }
    ],
    '4.卖进谈判力': [
      { value: '4.1 问题解决技巧', label: '4.1 问题解决技巧' },
      { value: '4.2 复杂局面研判', label: '4.2 复杂局面研判' },
      { value: '4.3 解决谈判阻力', label: '4.3 解决谈判阻力' },
      { value: '4.4 财务价值导向', label: '4.4 财务价值导向' }
    ],
    '5.客户发展力': [
      { value: '5.1 以客户为中心', label: '5.1 以客户为中心' },
      { value: '5.2 现有客户维护', label: '5.2 现有客户维护' },
      { value: '5.3 潜在客户开发', label: '5.3 潜在客户开发' }
    ],
    '6.卓越执行力': [
      { value: '6.1 驱动追求成就', label: '6.1 驱动追求成就' },
      { value: '6.2 卓越完美执行', label: '6.2 卓越完美执行' },
      { value: '6.3 打造高绩效团队', label: '6.3 打造高绩效团队' }
    ],
    '7.战略领导力': [
      { value: '7.1 战略思维', label: '7.1 战略思维' },
      { value: '7.2 学习创新', label: '7.2 学习创新' },
      { value: '7.3 主人翁精神', label: '7.3 主人翁精神' },
      { value: '7.4 使用数字化工具', label: '7.4 使用数字化工具' }
    ]
  }
  return subCompetencyMap[competency] || []
}

const QuestionForm = ({ question, onClose }) => {
  const { addQuestion, updateQuestion, CHANNELS, scenarios } = useQuestions()
  const [formData, setFormData] = useState({
    content: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'medium',
    explanation: '',
    channel: 'omnichannel',
    scenario: '',
    competency: '',
    subCompetency: ''
  })

  useEffect(() => {
    if (question) {
      // 处理导入题目的字段映射
      const mappedQuestion = {
        ...question,
        competency: question.capability || question.competency || '',
        subCompetency: question.subCapability || question.subCompetency || '',
        scenario: question.scenarioId || question.scenario || '',
        explanation: question.explanation || '',
        // 确保选项数组至少有4个元素
        options: question.options && question.options.length >= 4 
          ? question.options 
          : [...(question.options || []), ...Array(4 - (question.options?.length || 0)).fill('')]
      }
      setFormData(mappedQuestion)
    }
  }, [question])

  const handleCompetencyChange = (value) => {
    setFormData(prev => ({
      ...prev,
      competency: value,
      subCompetency: '' // 重置子能力项
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // 验证表单
    if (!formData.content.trim()) {
      alert('请输入题目内容')
      return
    }
    
    if (formData.options.some(option => !option.trim())) {
      alert('请填写所有选项')
      return
    }
    
    // 准备提交数据，确保字段映射正确
    const submitData = {
      ...formData,
      capability: formData.competency, // 映射到capability字段
      subCapability: formData.subCompetency, // 映射到subCapability字段
      scenarioId: formData.scenario, // 映射场景ID
      // 过滤掉空选项
      options: formData.options.filter(option => option.trim())
    }
    
    if (question) {
      updateQuestion(question.id, submitData)
    } else {
      addQuestion(submitData)
    }
    
    onClose()
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }))
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }))
  }

  const removeOption = (index) => {
    if (formData.options.length <= 2) {
      alert('至少需要2个选项')
      return
    }
    
    const newOptions = formData.options.filter((_, i) => i !== index)
    setFormData(prev => ({
      ...prev,
      options: newOptions,
      correctAnswer: prev.correctAnswer >= index ? Math.max(0, prev.correctAnswer - 1) : prev.correctAnswer
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {question ? '编辑题目' : '添加题目'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 题目内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                题目内容 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="input-field h-24 resize-none"
                placeholder="请输入题目内容..."
                required
              />
            </div>

            {/* 题目设置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  渠道
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) => handleChange('channel', e.target.value)}
                  className="input-field"
                >
                  <option value="omnichannel">全渠道</option>
                  {Object.entries(CHANNELS).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  难度
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleChange('difficulty', e.target.value)}
                  className="input-field"
                >
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
            </div>

            {/* 考察能力设置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  考察能力
                </label>
                <select
                  value={formData.competency}
                  onChange={(e) => handleCompetencyChange(e.target.value)}
                  className="input-field"
                >
                  {competencyOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  子能力项
                </label>
                <select
                  value={formData.subCompetency}
                  onChange={(e) => handleChange('subCompetency', e.target.value)}
                  className="input-field"
                  disabled={!formData.competency}
                >
                  <option value="">请选择子能力项</option>
                  {getSubCompetencyOptions(formData.competency).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所属场景
                </label>
                <select
                  value={formData.scenario}
                  onChange={(e) => handleChange('scenario', e.target.value)}
                  className="input-field"
                >
                  <option value="">无场景</option>
                  {scenarios && scenarios.map((scenario) => {
                    // 获取渠道中文名称
                    const channelName = CHANNELS[scenario.channel] || '全渠道';
                    // 格式化显示为：[渠道]+[场景编号]
                    const displayName = `${channelName}场景${scenario.order}`;
                    return (
                      <option key={scenario.id} value={scenario.id}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* 选项 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  选项 *
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center space-x-1 text-sm text-coca-red hover:text-coca-red-dark"
                >
                  <Plus size={16} />
                  <span>添加选项</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswer === index}
                        onChange={() => handleChange('correctAnswer', index)}
                        className="w-4 h-4 text-coca-red"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                    
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 input-field"
                      placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                      required
                    />
                    
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                选择正确答案，并确保所有选项都已填写
              </p>
            </div>

            {/* 解析 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                答案解析
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => handleChange('explanation', e.target.value)}
                className="input-field h-20 resize-none"
                placeholder="请输入答案解析，解释为什么这个答案是正确的..."
              />
            </div>

            {/* 按钮 */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {question ? '更新题目' : '添加题目'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default QuestionForm