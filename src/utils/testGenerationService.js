// 测验生成服务
export class TestGenerationService {
  constructor(questions, scenarios) {
    this.questions = questions || []
    this.scenarios = scenarios || []
  }

  // 难度分布配置
  static DIFFICULTY_DISTRIBUTION = {
    manager: { easy: 1, medium: 3, hard: 6 },      // 经理：1:3:6
    supervisor: { easy: 2, medium: 5, hard: 3 },   // 主管：2:5:3
    representative: { easy: 5, medium: 4, hard: 1 } // 销售代表：5:4:1
  }

  // 测验配置
  static TEST_CONFIG = {
    totalQuestions: 60,
    timeLimit: 90, // 分钟
    structure: {
      scenarioQuestions: 30,  // 场景题：30题（6个场景，每场景5题）
      channelQuestions: 10,   // 渠道专属非场景题：10题
      omnichannelQuestions: 20 // 全渠道非场景题：20题
    }
  }

  /**
   * 生成个性化测验
   * @param {Object} userInfo - 用户信息 {name, channel, position}
   * @returns {Object} 生成的测验对象
   */
  generatePersonalizedTest(userInfo) {
    const { channel, position } = userInfo
    
    try {
      // 1. 获取场景题（30题）
      const scenarioQuestions = this.getScenarioQuestions(channel)
      
      // 2. 获取渠道专属非场景题（10题）
      const channelQuestions = this.getChannelQuestions(channel)
      
      // 3. 获取全渠道非场景题（20题，按职级难度分布）
      const omnichannelQuestions = this.getOmnichannelQuestions(position)
      
      // 4. 组装测验卷
      const testQuestions = [
        ...scenarioQuestions,    // 1-30题：场景题
        ...channelQuestions,     // 31-40题：渠道专属非场景题
        ...omnichannelQuestions  // 41-60题：全渠道非场景题
      ]

      // 5. 创建测验对象
      const test = {
        id: `test_${Date.now()}`,
        userInfo,
        questions: testQuestions,
        structure: {
          scenarioQuestions: scenarioQuestions.length,
          channelQuestions: channelQuestions.length,
          omnichannelQuestions: omnichannelQuestions.length,
          total: testQuestions.length
        },
        timeLimit: TestGenerationService.TEST_CONFIG.timeLimit,
        createdAt: new Date().toISOString(),
        completed: false
      }

      return test
    } catch (error) {
      console.error('生成测验失败:', error)
      throw new Error(`测验生成失败: ${error.message}`)
    }
  }

  /**
   * 获取场景题（30题：6个场景，每场景5题）
   * @param {string} channel - 渠道
   * @returns {Array} 场景题数组
   */
  getScenarioQuestions(channel) {
    console.log('=== 获取真实场景题 ===')
    console.log('目标渠道:', channel)
    console.log('可用场景数:', this.scenarios.length)
    
    // 获取指定渠道的场景，按order排序
    const channelScenarios = this.scenarios
      .filter(scenario => scenario.channel === channel)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
    
    console.log(`${channel}渠道场景数:`, channelScenarios.length)
    
    const scenarioQuestions = []
    
    // 按场景顺序获取题目，每个场景最多5题
    channelScenarios.forEach((scenario, scenarioIndex) => {
      if (scenarioQuestions.length >= 30) return // 最多30题
      
      const scenarioQs = scenario.questions || []
      console.log(`场景${scenarioIndex + 1}(${scenario.title})题目数:`, scenarioQs.length)
      
      // 每个场景最多取5题
      const questionsToTake = Math.min(5, scenarioQs.length, 30 - scenarioQuestions.length)
      const selectedQuestions = scenarioQs.slice(0, questionsToTake)
      
      // 为每个题目添加场景信息
      selectedQuestions.forEach((question, questionIndex) => {
        scenarioQuestions.push({
          ...question,
          questionType: 'scenario',
          scenarioInfo: {
            id: scenario.id,
            title: scenario.title,
            description: scenario.description,
            scenarioIndex: scenarioIndex + 1,
            questionIndex: questionIndex + 1,
            order: scenario.order || scenarioIndex + 1
          }
        })
      })
    })
    
    // 如果场景题不足30题，从其他渠道补充
    if (scenarioQuestions.length < 30) {
      console.log(`${channel}渠道场景题不足，当前${scenarioQuestions.length}题，需要补充${30 - scenarioQuestions.length}题`)
      
      const otherChannelScenarios = this.scenarios
        .filter(scenario => scenario.channel !== channel)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
      
      otherChannelScenarios.forEach(scenario => {
        if (scenarioQuestions.length >= 30) return
        
        const scenarioQs = scenario.questions || []
        const questionsToTake = Math.min(5, scenarioQs.length, 30 - scenarioQuestions.length)
        const selectedQuestions = scenarioQs.slice(0, questionsToTake)
        
        selectedQuestions.forEach((question, questionIndex) => {
          if (scenarioQuestions.length < 30) {
            scenarioQuestions.push({
              ...question,
              questionType: 'scenario',
              scenarioInfo: {
                id: scenario.id,
                title: scenario.title,
                description: scenario.description,
                scenarioIndex: Math.floor(scenarioQuestions.length / 5) + 1,
                questionIndex: (scenarioQuestions.length % 5) + 1,
                order: scenario.order || 0
              }
            })
          }
        })
      })
    }
    
    console.log('最终场景题数:', scenarioQuestions.length)
    return scenarioQuestions.slice(0, 30)
  }

  /**
   * 获取渠道专属非场景题（10题）
   * @param {string} channel - 渠道
   * @returns {Array} 渠道专属题目数组
   */
  getChannelQuestions(channel) {
    // 获取指定渠道的非场景题
    const channelQuestions = this.questions.filter(q => 
      q.channel === channel && q.questionType === 'non-scenario'
    )

    // 随机打乱
    const shuffled = [...channelQuestions].sort(() => Math.random() - 0.5)
    
    // 如果渠道专属题目不足10题，从全渠道题目中补充
    if (shuffled.length < 10) {
      const omnichannelQuestions = this.questions.filter(q => 
        q.channel === 'omnichannel' && q.questionType === 'non-scenario'
      )
      const additionalQuestions = omnichannelQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 10 - shuffled.length)
      
      return [...shuffled, ...additionalQuestions].slice(0, 10)
    }

    return shuffled.slice(0, 10)
  }

  /**
   * 获取全渠道非场景题（20题，按职级难度分布）
   * @param {string} position - 职级
   * @returns {Array} 全渠道题目数组
   */
  getOmnichannelQuestions(position) {
    const distribution = TestGenerationService.DIFFICULTY_DISTRIBUTION[position]
    
    if (!distribution) {
      throw new Error(`未知的职级: ${position}`)
    }

    // 获取全渠道非场景题
    const omnichannelQuestions = this.questions.filter(q => 
      q.channel === 'omnichannel' && q.questionType === 'non-scenario'
    )

    // 按难度分组
    const questionsByDifficulty = {
      easy: omnichannelQuestions.filter(q => q.difficulty === 'easy'),
      medium: omnichannelQuestions.filter(q => q.difficulty === 'medium'),
      hard: omnichannelQuestions.filter(q => q.difficulty === 'hard')
    }

    const selectedQuestions = []

    // 按分布选择题目
    Object.entries(distribution).forEach(([difficulty, count]) => {
      const availableQuestions = questionsByDifficulty[difficulty]
      
      if (availableQuestions.length < count) {
        console.warn(`${difficulty} 难度题目不足，需要 ${count} 题，实际只有 ${availableQuestions.length} 题`)
      }
      
      // 随机选择指定数量的题目
      const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, count)
      selectedQuestions.push(...selected)
    })

    // 如果选中的题目不足20题，从剩余题目中随机补充
    if (selectedQuestions.length < 20) {
      const usedIds = new Set(selectedQuestions.map(q => q.id))
      const remainingQuestions = omnichannelQuestions.filter(q => !usedIds.has(q.id))
      const additional = remainingQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 20 - selectedQuestions.length)
      
      selectedQuestions.push(...additional)
    }

    // 随机打乱最终顺序
    return selectedQuestions.sort(() => Math.random() - 0.5).slice(0, 20)
  }

  /**
   * 获取额外的场景题（当指定渠道场景题不足时）
   * @param {string} excludeChannel - 要排除的渠道
   * @param {number} count - 需要的题目数量
   * @returns {Array} 额外的场景题
   */
  getAdditionalScenarioQuestions(excludeChannel, count) {
    const otherScenarios = this.scenarios.filter(scenario => 
      scenario.channel !== excludeChannel
    )

    const additionalQuestions = []
    
    otherScenarios.forEach(scenario => {
      if (additionalQuestions.length >= count) return
      
      // 修复：直接使用scenario.questions数组
      const scenarioQs = scenario.questions || []
      const validScenarioQs = scenarioQs.filter(q => q.questionType === 'scenario')

      validScenarioQs.forEach(question => {
        if (additionalQuestions.length < count) {
          additionalQuestions.push({
            ...question,
            scenarioInfo: {
              id: scenario.id,
              title: scenario.title,
              description: scenario.description,
              scenarioIndex: 0, // 标记为补充场景
              questionIndex: 0
            }
          })
        }
      })
    })

    return additionalQuestions.slice(0, count)
  }

  /**
   * 验证测验结构
   * @param {Object} test - 测验对象
   * @returns {Object} 验证结果
   */
  validateTest(test) {
    const issues = []
    const { questions, structure } = test

    // 检查总题目数
    if (questions.length !== 60) {
      issues.push(`总题目数不正确: 期望60题，实际${questions.length}题`)
    }

    // 检查场景题数量
    const scenarioQuestions = questions.filter((q, index) => index < 30)
    if (scenarioQuestions.length !== 30) {
      issues.push(`场景题数量不正确: 期望30题，实际${scenarioQuestions.length}题`)
    }

    // 检查渠道专属题数量
    const channelQuestions = questions.filter((q, index) => index >= 30 && index < 40)
    if (channelQuestions.length !== 10) {
      issues.push(`渠道专属题数量不正确: 期望10题，实际${channelQuestions.length}题`)
    }

    // 检查全渠道题数量
    const omnichannelQuestions = questions.filter((q, index) => index >= 40)
    if (omnichannelQuestions.length !== 20) {
      issues.push(`全渠道题数量不正确: 期望20题，实际${omnichannelQuestions.length}题`)
    }

    return {
      isValid: issues.length === 0,
      issues,
      structure
    }
  }
}

// 导出默认实例创建函数
export const createTestGenerationService = (questions, scenarios) => {
  return new TestGenerationService(questions, scenarios)
}

export default TestGenerationService