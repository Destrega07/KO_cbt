import React, { useState } from 'react'
import { Upload, Download, FileText, AlertTriangle, CheckCircle, Trash2, X } from 'lucide-react'
import { useQuestions } from '../context/QuestionContext'


const QuestionBankImporter = ({ onClose }) => {
  const { bulkImportQuestions, parseMarkdownContent, clearAllData, CHANNELS } = useQuestions()
  const [file, setFile] = useState(null)
  const [step, setStep] = useState('upload') // 'upload', 'preview', 'importing', 'result'
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  // 验证题目数据
  const validateQuestions = (questions) => {
    const valid = []
    const invalid = []
    const errors = []

    questions.forEach((question, index) => {
      const questionErrors = []
      
      if (!question.content || question.content.trim() === '') {
        questionErrors.push(`题目 ${index + 1}: 缺少题目内容`)
      }
      
      if (!question.options || question.options.length < 2) {
        questionErrors.push(`题目 ${index + 1}: 选项数量不足`)
      }
      
      if (question.correctAnswer === undefined || question.correctAnswer < 0) {
        questionErrors.push(`题目 ${index + 1}: 缺少正确答案`)
      }
      
      if (!question.difficulty) {
        questionErrors.push(`题目 ${index + 1}: 缺少难度设置`)
      }

      // T4校验：多选题选项数规则
      if (question.isMultipleChoice) {
        const optionCount = Array.isArray(question.options) ? question.options.length : 0
        const isScenario = (question.questionType === 'scenario') || (question.category === 'scenario') || (question.source === 'scenario')
        if (isScenario) {
          if (optionCount !== 5) {
            questionErrors.push(`题目 ${index + 1}: 场景多选需5项（A-E），当前${optionCount}项`)
          }
        } else {
          if (optionCount !== 4 && optionCount !== 5) {
            questionErrors.push(`题目 ${index + 1}: 非场景多选需4或5项（A-D或A-E），当前${optionCount}项`)
          }
        }
      }

      if (questionErrors.length === 0) {
        valid.push(question)
      } else {
        invalid.push(question)
        errors.push(...questionErrors)
      }
    })

    return { valid, invalid, errors }
  }

  // 生成导入报告
  const generateImportReport = (questions, scenarios) => {
    const questionsByChannel = {}
    const questionsByDifficulty = {}
    const questionsByCapability = {}

    questions.forEach(question => {
      // 渠道统计
      const channelName = CHANNELS[question.channel] || question.channel || '未知渠道'
      questionsByChannel[channelName] = (questionsByChannel[channelName] || 0) + 1

      // 难度统计
      questionsByDifficulty[question.difficulty] = (questionsByDifficulty[question.difficulty] || 0) + 1

      // 能力统计
      if (question.capability) {
        questionsByCapability[question.capability] = (questionsByCapability[question.capability] || 0) + 1
      }
    })

    return {
      questionsByChannel,
      questionsByDifficulty,
      questionsByCapability,
      totalQuestions: questions.length,
      totalScenarios: scenarios.length
    }
  }

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile && selectedFile.type === 'text/plain') {
      setFile(selectedFile)
    } else {
      alert('请选择.txt格式的文件')
    }
  }

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      const parsedData = parseMarkdownContent(content);
      
      const result = await bulkImportQuestions(parsedData);

      setImportResult({
        success: true,
        message: '题库导入成功！',
        importedCount: result.numQuestions,
        scenarioCount: result.numScenarios,
      });
      
      setStep('result');
    } catch (error) {
      console.error('导入失败:', error);
      setImportResult({
        success: false,
        message: '导入过程中发生错误',
        error: error.message,
      });
      setStep('result');
    } finally {
      setImporting(false);
    }
  };

  const handlePreview = async () => {
    if (!file) return

    try {
      const content = await file.text()
      const { questions, scenarios } = parseMarkdownContent(content)
      
      // 收集所有题目（包括场景中的题目）
      const allQuestions = [...questions]
      scenarios.forEach(scenario => {
        if (scenario.questions && scenario.questions.length > 0) {
          allQuestions.push(...scenario.questions)
        }
      })
      
      const validation = validateQuestions(allQuestions)
      const report = generateImportReport(validation.valid, scenarios)
      
      setImportResult({
        preview: true,
        report,
        validQuestions: validation.valid.length,
        invalidQuestions: validation.invalid.length,
        errors: validation.errors.slice(0, 10), // 只显示前10个错误
        scenarios: scenarios.length
      })
      setStep('preview')
    } catch (error) {
      alert('文件解析失败: ' + error.message)
    }
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

  const downloadTemplate = () => {
    const template = `可口可乐新题库

# 场景题

## CVS

### 场景1
场景描述内容...

第1题（易）- 1.1从数据到洞察
题目内容？
A. 选项A
B. 选项B
C. 选项C
D. 选项D
正确答案：A
选项分析：
A正确：解析内容
B错误：解析内容
C错误：解析内容
D错误：解析内容

# 非场景题

## 全渠道

第1题（中）- 2.1市场分析
题目内容？
A. 选项A
B. 选项B
C. 选项C
D. 选项D
正确答案：B
选项分析：
A错误：解析内容
B正确：解析内容
C错误：解析内容
D错误：解析内容`

    const blob = new Blob([template], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '题库导入模板.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">完整题库导入</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  导入完整题库文件
                </h3>
                <p className="text-gray-600 mb-6">
                  支持导入包含场景题和非场景题的完整题库文件（.txt格式）
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <div className="space-y-4">
                  <div>
                    <label className="btn-primary cursor-pointer">
                      <input
                        type="file"
                        accept=".txt"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      选择题库文件
                    </label>
                  </div>
                  {file && (
                    <div className="text-sm text-gray-600">
                      已选择: {file.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-x-3">
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="btn-danger flex items-center space-x-2"
                  >
                    <AlertTriangle size={20} />
                    <span>一键清空题库</span>
                  </button>
                </div>

                <div className="space-x-3">
                  <button
                    onClick={downloadTemplate}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Download size={20} />
                    <span>下载模板文件</span>
                  </button>
                </div>

                <div className="space-x-3">
                  <button
                    onClick={handlePreview}
                    disabled={!file}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    预览解析结果
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!file || importing}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? '导入中...' : '开始导入'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && importResult && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-500" size={24} />
                <h3 className="text-lg font-medium">解析预览</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResult.validQuestions}
                  </div>
                  <div className="text-sm text-gray-600">有效题目</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.scenarios}
                  </div>
                  <div className="text-sm text-gray-600">场景数量</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.invalidQuestions}
                  </div>
                  <div className="text-sm text-gray-600">无效题目</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(importResult.report.questionsByChannel).length}
                  </div>
                  <div className="text-sm text-gray-600">渠道类型</div>
                </div>
              </div>

              {importResult.report && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">渠道分布</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(importResult.report.questionsByChannel).map(([channel, count]) => (
                      <div key={channel} className="bg-gray-50 p-3 rounded">
                        <div className="font-medium">{channel}</div>
                        <div className="text-sm text-gray-600">{count} 题</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">发现的问题</h4>
                  <div className="bg-red-50 border border-red-200 rounded p-3 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('upload')}
                  className="btn-secondary"
                >
                  返回修改
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || importResult.invalidQuestions > 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? '导入中...' : '确认导入'}
                </button>
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="space-y-6">
              <div className="text-center">
                {importResult.success ? (
                  <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                ) : (
                  <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
                )}
                <h3 className={`text-lg font-medium mb-2 ${
                  importResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {importResult.message}
                </h3>
              </div>

              {importResult.success && importResult.report && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {importResult.importedCount}
                      </div>
                      <div className="text-sm text-gray-600">导入题目</div>
                    </div>
                    <div className="card text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.scenarioCount}
                      </div>
                      <div className="text-sm text-gray-600">导入场景</div>
                    </div>
                    <div className="card text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Object.keys(importResult.report.questionsByChannel).length}
                      </div>
                      <div className="text-sm text-gray-600">渠道类型</div>
                    </div>
                    <div className="card text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Object.keys(importResult.report.questionsByCapability).length}
                      </div>
                      <div className="text-sm text-gray-600">考察能力</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">渠道分布</h4>
                      <div className="space-y-2">
                        {Object.entries(importResult.report.questionsByChannel).map(([channel, count]) => (
                          <div key={channel} className="flex justify-between bg-gray-50 p-2 rounded">
                            <span>{channel}</span>
                            <span className="font-medium">{count} 题</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">难度分布</h4>
                      <div className="space-y-2">
                        {Object.entries(importResult.report.questionsByDifficulty).map(([difficulty, count]) => (
                          <div key={difficulty} className="flex justify-between bg-gray-50 p-2 rounded">
                            <span>{difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}</span>
                            <span className="font-medium">{count} 题</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!importResult.success && importResult.errors && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <h4 className="font-medium text-red-600 mb-2">错误详情</h4>
                  <div className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={onClose}
                  className="btn-primary"
                >
                  完成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 清空题库确认对话框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="text-red-500" size={24} />
                <h3 className="text-lg font-medium text-gray-800">确认清空题库</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                此操作将永久删除所有题目、场景、测验记录和结果数据，且无法恢复。请输入管理员密码确认：
              </p>
              
              <div className="mb-4">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="请输入管理员密码"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleClearDatabase()}
                />
              </div>
              
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

export default QuestionBankImporter