import React, { useState } from 'react'
import { useQuestions } from '../context/QuestionContext'
import { Upload, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react'

const BulkImportModal = ({ onClose }) => {
  const { bulkImportQuestions, parseMarkdownContent } = useQuestions()
  const [importMethod, setImportMethod] = useState('markdown') // 'markdown' or 'manual'
  const [content, setContent] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    if (!content.trim()) {
      alert('请输入要导入的内容')
      return
    }

    setLoading(true)
    try {
      let questions = []
      
      if (importMethod === 'markdown') {
        questions = parseMarkdownContent(content)
      }
      
      if (questions.length === 0) {
        setImportResult({ success: false, message: '未能解析出有效题目，请检查格式' })
      } else {
        const importedCount = bulkImportQuestions(questions)
        setImportResult({ 
          success: true, 
          message: `成功导入 ${importedCount} 道题目`,
          count: importedCount 
        })
        setContent('')
      }
    } catch (error) {
      setImportResult({ success: false, message: '导入失败：' + error.message })
    }
    setLoading(false)
  }

  const sampleMarkdown = `1. 可口可乐公司成立于哪一年？
A. 1885年
B. 1886年
C. 1887年
D. 1888年
答案：B
解析：可口可乐公司成立于1886年，由约翰·彭伯顿博士在美国亚特兰大创立。
难度：简单
类别：专业

2. 在销售过程中，建立客户信任的最有效方法是什么？
A. 价格优惠
B. 专业知识展示
C. 真诚沟通
D. 产品演示
答案：C
解析：真诚沟通是建立客户信任的基础，通过诚实、透明的交流建立长期关系。
难度：中等
类别：通用`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">批量导入题目</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 导入方式选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择导入方式
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setImportMethod('markdown')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  importMethod === 'markdown' 
                    ? 'border-coca-red bg-red-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="text-coca-red" size={24} />
                  <div>
                    <h3 className="font-medium">Markdown 格式</h3>
                    <p className="text-sm text-gray-600">支持结构化文本导入</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setImportMethod('word')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  importMethod === 'word' 
                    ? 'border-coca-red bg-red-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled
              >
                <div className="flex items-center space-x-3">
                  <Upload className="text-gray-400" size={24} />
                  <div>
                    <h3 className="font-medium text-gray-400">Word 文档</h3>
                    <p className="text-sm text-gray-400">即将支持 (.docx)</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Markdown 导入界面 */}
          {importMethod === 'markdown' && (
            <div className="space-y-4">
              {/* 格式说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Markdown 格式说明</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• 题目以数字开头：1. 题目内容</p>
                  <p>• 选项格式：A. 选项内容</p>
                  <p>• 答案格式：答案：A</p>
                  <p>• 解析格式：解析：解释内容</p>
                  <p>• 难度格式：难度：简单/中等/困难</p>
                  <p>• 类别格式：类别：专业/通用</p>
                  <p>• 考察能力格式：考察能力：1.全域洞察力</p>
                  <p>• 子能力项格式：子能力项：1.1 从数据到洞察</p>
                </div>
              </div>

              {/* 示例下载 */}
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  题目内容
                </label>
                <button
                  onClick={() => {
                    const blob = new Blob([sampleMarkdown], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = '题目导入模板.md'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="flex items-center space-x-2 text-sm text-coca-red hover:text-coca-red-dark"
                >
                  <Download size={16} />
                  <span>下载模板</span>
                </button>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-coca-red focus:border-coca-red"
                placeholder="请粘贴或输入要导入的题目内容..."
              />

              {/* 导入结果 */}
              {importResult && (
                <div className={`p-4 rounded-lg border ${
                  importResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {importResult.success ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <AlertTriangle className="text-red-600" size={20} />
                    )}
                    <span className={`font-medium ${
                      importResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {importResult.message}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Word 文档导入界面 */}
          {importMethod === 'word' && (
            <div className="text-center py-12">
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Word 文档导入</h3>
              <p className="text-gray-500 mb-4">此功能正在开发中，敬请期待</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-yellow-800 mb-2">临时解决方案</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>1. 将 Word 文档内容复制到文本编辑器</p>
                  <p>2. 按照 Markdown 格式整理</p>
                  <p>3. 使用 Markdown 导入功能</p>
                </div>
              </div>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              取消
            </button>
            {importMethod === 'markdown' && (
              <button
                onClick={handleImport}
                disabled={loading || !content.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '导入中...' : '开始导入'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkImportModal