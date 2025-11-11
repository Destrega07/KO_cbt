import React, { useState } from 'react'
import { X, User, Building, Award } from 'lucide-react'

const TestUserInfoModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    channel: '',
    position: ''
  })
  const [errors, setErrors] = useState({})

  const channelOptions = [
    { value: 'cvs', label: 'CVS' },
    { value: 'hypermarket', label: '大卖场/超市' },
    { value: 'ed', label: 'E&D' },
    { value: 'ecommerce', label: '电商' },
    { value: 'special', label: '特殊渠道' }
  ]

  const positionOptions = [
    { value: 'manager', label: '经理' },
    { value: 'supervisor', label: '主管' },
    { value: 'representative', label: '销售代表' }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = '请输入姓名'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '姓名至少需要2个字符'
    }
    
    if (!formData.channel) {
      newErrors.channel = '请选择渠道'
    }
    
    if (!formData.position) {
      newErrors.position = '请选择职级'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit({
        ...formData,
        name: formData.name.trim()
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-coca-red rounded-full flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">开始测试</h2>
              <p className="text-sm text-gray-600">请填写您的基本信息</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 姓名输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-2" />
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入您的姓名"
              className={`input-field w-full ${errors.name ? 'border-red-300 focus:border-red-500' : ''}`}
              maxLength={20}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* 渠道选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building size={16} className="inline mr-2" />
              渠道 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.channel}
              onChange={(e) => handleInputChange('channel', e.target.value)}
              className={`input-field w-full ${errors.channel ? 'border-red-300 focus:border-red-500' : ''}`}
            >
              <option value="">请选择您的渠道</option>
              {channelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.channel && (
              <p className="text-red-500 text-sm mt-1">{errors.channel}</p>
            )}
          </div>

          {/* 职级选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Award size={16} className="inline mr-2" />
              职级 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              className={`input-field w-full ${errors.position ? 'border-red-300 focus:border-red-500' : ''}`}
            >
              <option value="">请选择您的职级</option>
              {positionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.position && (
              <p className="text-red-500 text-sm mt-1">{errors.position}</p>
            )}
          </div>

          {/* 测试说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">测试说明</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 测试时间：90分钟</li>
              <li>• 题目数量：60题</li>
              <li>• 包含场景题和非场景题</li>
              <li>• 请在规定时间内完成所有题目</li>
            </ul>
          </div>

          {/* 按钮组 */}
          <div className="flex items-center justify-end space-x-3 pt-4">
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
              开始测试
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TestUserInfoModal