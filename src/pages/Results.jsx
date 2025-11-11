import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Award, Target, TrendingUp, Home } from 'lucide-react'
import { CAPABILITIES, SUB_CAPABILITIES } from '../data/questionBank'
import { generateGrowthLetter, aiConfig } from '../utils/aiService'

const Results = () => {
  const { resultId } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  // 将所有 Hooks 放在条件 return 之前，避免“Rendered more hooks than during the previous render”
  const [growthLetter, setGrowthLetter] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState('')

  useEffect(() => {
    const loadResult = () => {
      try {
        // 修复：使用正确的localStorage键名
        const savedResults = JSON.parse(localStorage.getItem('coca_cola_results') || '[]')
        const foundResult = savedResults.find(r => r.id === resultId)
        
        if (foundResult) {
          setResult(foundResult)
        } else {
          console.error('Result not found')
          console.log('Available results:', savedResults.map(r => r.id))
          console.log('Looking for resultId:', resultId)
        }
      } catch (error) {
        console.error('Error loading result:', error)
      } finally {
        setLoading(false)
      }
    }

    loadResult()
  }, [resultId])

  // 当结果加载完成后，若已有 growthLetter，则同步到本地状态
  useEffect(() => {
    if (result?.growthLetter) {
      setGrowthLetter(result.growthLetter)
    }
  }, [result?.growthLetter])

  // 页面进入后自动生成成长信（若本地尚未生成过）
  useEffect(() => {
    if (result && !growthLetter && !genLoading && !genError) {
      // 自动触发生成
      handleGenerateGrowthLetter()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载测试结果中...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">未找到测试结果</h2>
          <p className="text-gray-600 mb-4">可能的原因：</p>
          <ul className="text-sm text-gray-500 mb-6 text-left max-w-md">
            <li>• 测试结果已过期或被清除</li>
            <li>• 浏览器存储数据丢失</li>
            <li>• 测试未正常完成</li>
          </ul>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            返回首页重新测试
          </Link>
        </div>
      </div>
    )
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBackground = (score) => {
    if (score >= 80) return 'border-green-200 bg-green-50'
    if (score >= 60) return 'border-yellow-200 bg-yellow-50'
    return 'border-red-200 bg-red-50'
  }

  const round = (v) => Math.round(Number(v) || 0)

  const performance = (() => {
    const score = result?.totals?.scoreRate != null
      ? round(result.totals.scoreRate)
      : round(result.score)
    if (score >= 90) return { level: '优秀', description: '表现卓越，专业能力突出' }
    if (score >= 80) return { level: '良好', description: '表现良好，具备较强的专业能力' }
    if (score >= 60) return { level: '合格', description: '达到基本要求，仍有提升空间' }
    return { level: '待提升', description: '需要加强学习，提升专业能力' }
  })()

  // 能力/子能力字典
  const capabilityEntries = Object.entries(CAPABILITIES)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([key, name]) => ({ key, name }))

  const subCapabilityEntries = Object.entries(SUB_CAPABILITIES)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, name]) => ({ key, name }))

  // 辅助：从子能力key推导能力key（"x.y" -> "x"）
  const getCapKeyFromSub = (subKey) => {
    if (!subKey || typeof subKey !== 'string') return null
    const m = subKey.match(/^(\d+)\./)
    return m ? m[1] : null
  }

  // 辅助：提取子能力键（例如 "1.1 从数据到洞察" -> "1.1"）
  const extractSubCapabilityKey = (text) => {
    if (!text || typeof text !== 'string') return null
    const m = text.match(/^(\d+(?:\.\d+)+)/)
    return m ? m[1] : null
  }

  // 使用整套测试题（共60题）进行统计
  const allQuestionResults = Array.isArray(result.questionResults)
    ? result.questionResults
    : (Array.isArray(result.answers) ? result.answers : [])

  // 计算7项能力的“得分率（整数）”——按场景题
  const getCapKeyFromCapabilityName = (capName) => {
    if (!capName || typeof capName !== 'string') return null
    const m = capName.match(/^(\d+)\./)
    return m ? m[1] : null
  }

  const competencyStats = capabilityEntries.map(cap => {
    const items = allQuestionResults.filter(qr => {
      const k = qr.capabilityKey || getCapKeyFromSub(qr.subCapabilityKey || qr.subCapability) || getCapKeyFromCapabilityName(qr.capability || qr.question?.capability)
      return k === cap.key
    })
    // 新结构优先：possibleScore/earnedScore；旧结构回退为正确题计数
    const totalPossible = items.reduce((sum, it) => sum + (Number(it.possibleScore) || 1), 0)
    const totalEarned = items.reduce((sum, it) => sum + (Number(it.earnedScore) || (it.isCorrect ? 1 : 0)), 0)
    const scoreRate = totalPossible > 0 ? round((totalEarned / totalPossible) * 100) : 0

    return {
      capability: cap.name,
      key: cap.key,
      correct: items.filter(it => it.isCorrect).length,
      total: items.length,
      scoreRate,
      // 兼容旧UI字段
      accuracy: scoreRate
    }
  })

  // 成长信生成相关方法
  const saveLetterToLocal = (text) => {
    try {
      const saved = JSON.parse(localStorage.getItem('coca_cola_results') || '[]')
      const idx = saved.findIndex(r => r.id === result.id)
      if (idx >= 0) {
        saved[idx].growthLetter = text
        localStorage.setItem('coca_cola_results', JSON.stringify(saved))
      }
    } catch (e) {
      console.warn('保存成长信到本地失败：', e)
    }
  }

  const buildGrowthPayload = () => {
    const agg = {}
    allQuestionResults.forEach(it => {
      const raw = it.subCapabilityKey || it.subCapability
      const sub = extractSubCapabilityKey(raw)
      if (!sub) return
      if (!agg[sub]) agg[sub] = { possible: 0, earned: 0, name: null }
      agg[sub].possible += (Number(it.possibleScore) || 1)
      agg[sub].earned += (Number(it.earnedScore) || (it.isCorrect ? 1 : 0))
    })

    const rows = subCapabilityEntries.map(sc => {
      const hit = agg[sc.key]
      if (!hit) return null
      const percentage = hit.possible > 0 ? Math.round((hit.earned / hit.possible) * 100) : 0
      return {
        code: sc.key,
        name: sc.name,
        score: Math.round(hit.earned),
        total: Math.round(hit.possible),
        percentage,
      }
    }).filter(Boolean)

    // 强项与待提升项的选择规则
    // 1) 优秀能力：若有>=4项得分率并列最高，则在这些项中按绝对得分(earned)由高到低选3项；否则按得分率由高到低选3项（并以 earned 作为次级排序）
    const sorted = [...rows].sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage
      // 次级：绝对得分优先
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0)
      // 再次级：题分值(total)高者优先
      return (b.total || 0) - (a.total || 0)
    })
    const bestRate = sorted.length ? sorted[0].percentage : 0
    const bestGroup = sorted.filter(r => r.percentage === bestRate)
    const strengths = (bestGroup.length >= 4
      ? [...bestGroup].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3)
      : sorted.slice(0, 3)
    ).map(i => i.name)

    // 2) 待提升能力：若有>=3项得分率并列最低，则在这些项中按题分值(total)由高到低选2项；否则按得分率由低到高选2项（并以 total 作为次级排序）
    const ascSorted = [...rows].sort((a, b) => {
      if (a.percentage !== b.percentage) return a.percentage - b.percentage
      // 次级：题分值(total)高者优先（为了在相同得分率下挑选题分值高的）
      if ((b.total || 0) !== (a.total || 0)) return (b.total || 0) - (a.total || 0)
      // 再次级：绝对得分(earned)低者优先（体现薄弱）
      return (a.score || 0) - (b.score || 0)
    })
    const worstRate = ascSorted.length ? ascSorted[0].percentage : 0
    const worstGroup = ascSorted.filter(r => r.percentage === worstRate)
    const improvements = (worstGroup.length >= 3
      ? [...worstGroup].sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 2)
      : ascSorted.slice(0, 2)
    ).map(i => i.name)

    const name = result?.userInfo?.name || result?.user?.name || '同学'
    const position = result?.userInfo?.position || result?.user?.position || '销售代表'
    const channel = result?.userInfo?.channel || result?.user?.channel || result?.channel || '渠道未设定'
    const year = result?.completedAt ? new Date(result.completedAt).getFullYear() : new Date().getFullYear()

    return {
      name,
      position,
      channel,
      year,
      abilities: rows,
      strengths,
      improvements,
      writingHints: ['整体语气温暖、鼓励', '结尾增加“期盼与鼓励”，落款“来自未来的{姓名}”'],
    }
  }

  const handleGenerateGrowthLetter = async () => {
    setGenLoading(true)
    setGenError('')
    try {
      const payload = buildGrowthPayload()
      const { letter } = await generateGrowthLetter(payload)
      setGrowthLetter(letter)
      saveLetterToLocal(letter)
    } catch (err) {
      setGenError(err?.message || '生成失败')
    } finally {
      setGenLoading(false)
    }
  }

  // 雷达图组件（双折线：个人 vs 同职级同年均值）
  const RadarChart = ({ userData, peerData }) => {
    const size = 300
    const center = size / 2
    const radius = 100
    const levels = 5

    // 计算点的坐标
    const getPoint = (angle, value, maxRadius = radius) => {
      const radian = (angle - 90) * Math.PI / 180
      const r = (value / 100) * maxRadius
      return {
        x: center + r * Math.cos(radian),
        y: center + r * Math.sin(radian)
      }
    }

    // 生成网格线
    const gridLines = []
    for (let level = 1; level <= levels; level++) {
      const points = []
      for (let i = 0; i < userData.length; i++) {
        const angle = (360 / userData.length) * i
        const point = getPoint(angle, 100, (radius * level) / levels)
        points.push(`${point.x},${point.y}`)
      }
      gridLines.push(
        <polygon
          key={level}
          points={points.join(' ')}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      )
    }

    // 生成轴线
    const axisLines = userData.map((item, index) => {
      const angle = (360 / userData.length) * index
      const point = getPoint(angle, 100)
      return (
        <line
          key={index}
          x1={center}
          y1={center}
          x2={point.x}
          y2={point.y}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      )
    })

    // 生成数据多边形（个人）
    const userPoints = userData.map((item, index) => {
      const angle = (360 / userData.length) * index
      return getPoint(angle, item.scoreRate)
    })

    const userPolygon = userPoints.map(point => `${point.x},${point.y}`).join(' ')

    // 生成数据多边形（同职级同年）
    const peerPoints = peerData && peerData.length === userData.length
      ? peerData.map((item, index) => {
          const angle = (360 / peerData.length) * index
          return getPoint(angle, item.scoreRate)
        })
      : []

    const peerPolygon = peerPoints.map(point => `${point.x},${point.y}`).join(' ')

    // 生成标签
    const labels = userData.map((item, index) => {
      const angle = (360 / userData.length) * index
      const point = getPoint(angle, 100, radius + 30)
      return (
        <text
          key={index}
          x={point.x}
          y={point.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-gray-600"
        >
          {item.capability}
        </text>
      )
    })

    return (
      <div className="flex flex-col items-center w-full">
        <svg width={size} height={size} className="overflow-visible">
          {gridLines}
          {axisLines}
          {/* 个人雷达线 */}
          <polygon
            points={userPolygon}
            fill="rgba(239, 68, 68, 0.2)"
            stroke="#ef4444"
            strokeWidth="2"
          />
          {userPoints.map((point, index) => (
            <circle
              key={`u-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#ef4444"
            />
          ))}
          {/* 同职级同年均值雷达线 */}
          {peerPoints.length > 0 && (
            <>
              <polygon
                points={peerPolygon}
                fill="rgba(59, 130, 246, 0.15)"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              {peerPoints.map((point, index) => (
                <circle
                  key={`p-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="3.5"
                  fill="#3b82f6"
                />
              ))}
            </>
          )}
          {labels}
        </svg>
        {/* 图例（居中显示，与雷达图一致）*/}
        <div className="mt-2 flex items-center justify-center gap-4 text-sm text-gray-600 w-full">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
            <span>个人得分率</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
            <span>同职级同年均值</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* 成绩概览 - 左右布局 */}
      <div className={`card border-2 ${getScoreBackground(result?.totals?.scoreRate != null ? round(result.totals.scoreRate) : round(result.score))}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧 1/3 - 整体正确率 */}
          <div className="lg:col-span-1">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
                <Award className="text-white" size={32} />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 mb-2">测试完成</h1>
              <p className="text-gray-600 mb-6">可口可乐销售能力评估结果</p>
              
              <div className="bg-white rounded-lg p-6 mb-6">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(result?.totals?.scoreRate != null ? round(result.totals.scoreRate) : round(result.score))}`}>
                  {result?.totals?.scoreRate != null ? round(result.totals.scoreRate) : round(result.score)}%
                </div>
                <div className="text-lg text-gray-600 mb-2">
                  {(result?.totals?.correctCount ?? result?.correctAnswers ?? 0)} / {(result?.totals?.totalQuestions ?? result?.totalQuestions ?? 0)} 题正确
                </div>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  (result?.totals?.scoreRate != null ? round(result.totals.scoreRate) : round(result.score)) >= 80 
                    ? 'bg-green-100 text-green-800'
                    : (result?.totals?.scoreRate != null ? round(result.totals.scoreRate) : round(result.score)) >= 60
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {performance.level}
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{performance.description}</p>
              <p className="text-sm text-gray-500">
                完成时间：{new Date(result.completedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* 右侧 2/3 - 雷达图（得分率，双雷达线）*/}
          <div className="lg:col-span-2">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">能力雷达图</h2>
              <p className="text-gray-600">7项考察能力得分率分布（整数）</p>
            </div>
            {/* 计算同职级同年均值（基于本地历史结果，整套题目） */}
            {(() => {
              const saved = JSON.parse(localStorage.getItem('coca_cola_results') || '[]')
              const currYear = result?.completedAt ? new Date(result.completedAt).getFullYear() : null
              const currPosition = result?.userInfo?.position || result?.user?.position || null
              const peers = saved.filter(r => {
                const y = r?.completedAt ? new Date(r.completedAt).getFullYear() : null
                const p = r?.userInfo?.position || r?.user?.position || null
                return r.id !== result.id && y === currYear && p === currPosition
              })

              // 聚合 peers 的整套题得分率（按能力key微观汇总）
              const peerStats = capabilityEntries.map(cap => {
                let earned = 0
                let possible = 0
                peers.forEach(pr => {
                  const prItems = Array.isArray(pr.questionResults) ? pr.questionResults : (Array.isArray(pr.answers) ? pr.answers : [])
                  prItems.forEach(it => {
                    const k = it.capabilityKey || getCapKeyFromSub(it.subCapabilityKey || it.subCapability)
                    if (k === cap.key) {
                      possible += (Number(it.possibleScore) || 1)
                      earned += (Number(it.earnedScore) || (it.isCorrect ? 1 : 0))
                    }
                  })
                })
                const rate = possible > 0 ? round((earned / possible) * 100) : 0
                return { capability: cap.name, key: cap.key, scoreRate: rate }
              })

              const hasPeer = peers.length > 0 && peerStats.some(s => s.scoreRate > 0)

              return (
                <>
                  <RadarChart userData={competencyStats} peerData={hasPeer ? peerStats : []} />
                  {!hasPeer && (
                    <p className="text-center text-sm text-gray-500 mt-2">暂无同职级同年均值数据</p>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* 按难度统计 - 保留原有模块（兼容新旧结构，优先显示得分率） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {result.difficultyStats && result.difficultyStats.map((stat) => {
          const rate = stat.scoreRate != null ? round(stat.scoreRate) : round(stat.accuracy)
          const correct = stat.correct ?? stat.correctCount ?? 0
          const total = stat.total ?? stat.totalQuestions ?? 0
          return (
          <div key={stat.difficulty} className="card">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.difficulty === 'easy' 
                  ? 'bg-green-100'
                  : stat.difficulty === 'medium'
                  ? 'bg-yellow-100'
                  : 'bg-red-100'
              }`}>
                <Target className={`${
                  stat.difficulty === 'easy' 
                    ? 'text-green-600'
                    : stat.difficulty === 'medium'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`} size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">
                  {stat.difficulty === 'easy' ? '简单题目' : 
                   stat.difficulty === 'medium' ? '中等题目' : '困难题目'}
                </h3>
                <p className="text-sm text-gray-600">
                  {correct} / {total} 题正确
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full ${
                  stat.difficulty === 'easy' 
                    ? 'bg-green-500'
                    : stat.difficulty === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${rate}%` }}
              ></div>
            </div>
            <p className="text-right text-sm font-medium text-gray-700">
              {rate}%
            </p>
          </div>
        )})}
      </div>

      {/* 详细分析（子能力，整套题目） - 显示总分/得分/得分率（整数）+ 红黄绿灯 */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">详细分析（子能力）</h2>
        </div>
        {(() => {
          // 聚合子能力（整套题目，兼容旧数据）
          const agg = {}
          allQuestionResults.forEach(it => {
            const raw = it.subCapabilityKey || it.subCapability
            const sub = extractSubCapabilityKey(raw)
            if (!sub) return
            if (!agg[sub]) agg[sub] = { possible: 0, earned: 0 }
            agg[sub].possible += (Number(it.possibleScore) || 1)
            agg[sub].earned += (Number(it.earnedScore) || (it.isCorrect ? 1 : 0))
          })
          const rows = subCapabilityEntries
            .filter(sc => agg[sc.key])
            .map(sc => {
              const { possible, earned } = agg[sc.key]
              const rate = possible > 0 ? round((earned / possible) * 100) : 0
              return { key: sc.key, name: sc.name, possible, earned, rate }
            })

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rows.length === 0 ? (
                <p className="text-sm text-gray-500">暂无子能力数据</p>
              ) : rows.map((row) => (
                <div key={row.key} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800">{row.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      得分：{round(row.earned)} / {round(row.possible)}
                    </span>
                    <span className={`text-sm font-medium ${
                      row.rate >= 80 ? 'text-green-600' : row.rate < 60 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {row.rate}%
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        row.rate >= 80 ? 'bg-green-500' : row.rate < 60 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${row.rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* 成长信模块（位于详细分析模块下方） */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">成长信（未来的我致今天的我）</h2>
          <div className="flex items-center gap-2">
            {growthLetter && (
              <button
                onClick={() => {
                  const blob = new Blob([growthLetter], { type: 'text/plain;charset=utf-8' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${(result?.userInfo?.name || '成长信')}.txt`
                  document.body.appendChild(a)
                  a.click()
                  URL.revokeObjectURL(url)
                  a.remove()
                }}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                下载为txt文件
              </button>
            )}
          </div>
        </div>

        {genError && (
          <p className="text-red-600 text-sm mb-3">{genError}</p>
        )}
        {growthLetter ? (
          <div className="bg-white rounded-lg p-6">
            <div className="font-handwriting text-gray-800 whitespace-pre-wrap leading-8">
              {growthLetter}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">系统正在为您自动生成成长信，请稍候…</p>
        )}
      </div>

      {/* 改进建议模块：按需求移除 */}

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link 
          to={`/review/${resultId}`}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
        >
          查看详细解析
        </Link>
        <Link 
          to="/"
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center flex items-center justify-center gap-2"
        >
          <Home size={20} />
          返回首页
        </Link>
      </div>
    </div>
  )
}

export default Results