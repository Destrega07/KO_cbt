import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuestions } from '../context/QuestionContext'
import { Play, BarChart3, BookOpen, Database, Calendar, Award, Clock, Users } from 'lucide-react'
import CocaColaBottleCap from '../components/CocaColaBottleCap'

const Dashboard = () => {
  const { user, isAdmin } = useAuth()
  const { questions, results, scenarios, getQuestionStatistics } = useQuestions()
  const navigate = useNavigate()

  const userResults = results.filter(r => r.userId === user.id)
  const averageScore = userResults.length > 0 
    ? (userResults.reduce((sum, r) => sum + parseFloat(r.score), 0) / userResults.length).toFixed(1)
    : 0

  // 获取动态统计信息
  const questionStats = getQuestionStatistics()
  
  // 计算场景题统计
  const scenarioStats = {
    totalScenarios: scenarios.length,
    totalScenarioQuestions: scenarios.reduce((sum, scenario) => {
      return sum + (scenario.questions ? scenario.questions.length : 0)
    }, 0),
    averageQuestionsPerScenario: scenarios.length > 0 
      ? Math.round(scenarios.reduce((sum, scenario) => {
          return sum + (scenario.questions ? scenario.questions.length : 0)
        }, 0) / scenarios.length)
      : 0
  }

  // 计算非场景题统计
  const nonScenarioQuestions = questions.filter(q => q.questionType === 'non-scenario')
  const channelQuestions = nonScenarioQuestions.filter(q => q.channel !== 'omnichannel')
  const omnichannelQuestions = nonScenarioQuestions.filter(q => q.channel === 'omnichannel')

  const handleStartPersonalizedTest = () => {
    // 导航到新的个性化测试
    navigate('/quiz/new')
  }

  const stats = [
    {
      label: '题库总数',
      value: questions.length,
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      label: '已完成测试',
      value: userResults.length,
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      label: '平均分数',
      value: `${averageScore}%`,
      icon: Award,
      color: 'bg-yellow-500'
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 欢迎区域 */}
      <div className="card bg-gradient-to-r from-coca-red to-coca-red-dark text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">欢迎回来，{user.name}！</h1>
            <p className="text-red-100 text-lg">
              {isAdmin ? '管理题库和查看系统统计' : '开始您的个性化销售能力评估'}
            </p>
          </div>
          <div className="flex items-center justify-center">
            <CocaColaBottleCap size={96} />
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 题库统计详情 */}
      {isAdmin && (
        <div className="card bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 mb-4">题库详细统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{scenarioStats.totalScenarios}</div>
              <div className="text-sm text-gray-600">场景数量</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{scenarioStats.totalScenarioQuestions}</div>
              <div className="text-sm text-gray-600">场景题总数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{channelQuestions.length}</div>
              <div className="text-sm text-gray-600">渠道专属题</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{omnichannelQuestions.length}</div>
              <div className="text-sm text-gray-600">全渠道题</div>
            </div>
          </div>
        </div>
      )}

      {/* 主要操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 开始个性化测试 */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-coca-red rounded-lg flex items-center justify-center">
              <Play className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">开始个性化测试</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            根据您的渠道和职级生成个性化测验，包含场景题和非场景题，全面评估您的销售能力。
          </p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-sm">
              <Users className="text-gray-400" size={16} />
              <span className="text-gray-600">
                场景题：{scenarioStats.totalScenarioQuestions}题
                {scenarioStats.totalScenarios > 0 && (
                  <span className="text-gray-500">
                    （{scenarioStats.totalScenarios}个场景，平均每场景{scenarioStats.averageQuestionsPerScenario}题）
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <BookOpen className="text-gray-400" size={16} />
              <span className="text-gray-600">渠道专属题：{channelQuestions.length}题</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Database className="text-gray-400" size={16} />
              <span className="text-gray-600">全渠道题：{omnichannelQuestions.length}题（按职级难度分布）</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Clock className="text-gray-400" size={16} />
              <span className="text-gray-600">测试时间：90分钟</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-2">
              <span>总计</span>
              <span>{questions.length}题</span>
            </div>
          </div>
          
          {/* 测试可行性提示 */}
          {scenarioStats.totalScenarioQuestions < 30 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-yellow-800">
                <strong>提示：</strong> 场景题数量不足30题，可能影响个性化测试的生成。
                建议联系管理员补充场景题目。
              </div>
            </div>
          )}
          
          <button 
            onClick={handleStartPersonalizedTest}
            className="w-full btn-primary"
            disabled={scenarioStats.totalScenarioQuestions < 30}
          >
            {scenarioStats.totalScenarioQuestions < 30 ? '题库不足，暂不可用' : '开始个性化测试'}
          </button>
        </div>

        {/* 查看历史记录 */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">测试历史</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            查看您的测试历史记录和详细分析报告。
          </p>
          
          {userResults.length > 0 ? (
            <div className="space-y-3 mb-6">
              {userResults.slice(-3).map((result, index) => (
                <div key={result.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">测试 #{userResults.length - index}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(result.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-coca-red">{result.score}%</p>
                    <Link 
                      to={`/review/${result.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      查看详情
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-3 opacity-50" />
              <p>暂无测试记录</p>
            </div>
          )}
          
          <Link to="/results" className="w-full btn-secondary text-center block">
            查看全部历史
          </Link>
        </div>
      </div>

      {/* 管理员专用区域 */}
      {isAdmin && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Database className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">管理员功能</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            管理题库内容，添加、编辑和删除题目。
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/question-bank" className="btn-primary text-center">
              题库管理
            </Link>
            <button className="btn-secondary" onClick={() => {
              const totalResults = results.length
              const stats = getQuestionStatistics()
              alert(`系统统计：\n总测试次数：${totalResults}\n题库题目：${questions.length}道\n场景数量：${stats.scenarios}\n场景题数：${scenarioStats.totalScenarioQuestions}道\n非场景题数：${nonScenarioQuestions.length}道`)
            }}>
              系统统计
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard