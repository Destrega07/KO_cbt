// 纯JS题库解析器：将 Markdown 文本（如 QuestionBank_Optimized.txt）解析为
// SCENARIOS 与 QUESTION_BANK 两个数组，供生成静态数据文件使用。
// 注意：保持与现有能力/子能力命名一致，场景ID与题目引用一致。

// 渠道映射
const CHANNEL_MAPPING = {
  'CVS': 'cvs',
  '大卖场/超市': 'hypermarket',
  '电商': 'ecommerce',
  'E&D': 'ed',
  '特殊渠道': 'special',
  '全渠道': 'omnichannel'
}

// 能力名称（与现有代码保持一致）
export const CAPABILITIES = {
  '1': '1.全域洞察力',
  '2': '2.方案规划力',
  '3': '3.故事沟通力',
  '4': '4.卖进谈判力',
  '5': '5.客户发展力',
  '6': '6.卓越执行力',
  '7': '7.战略领导力'
}

// 子能力名称（与现有代码保持一致）
export const SUB_CAPABILITIES = {
  '1.1': '1.1 从数据到洞察',
  '1.2': '1.2 品类分析应用',
  '2.1': '2.1 渠道解决方案',
  '2.2': '2.2 职能解决方案',
  '2.2.1': '2.2.1 收益管理',
  '2.2.2': '2.2.2 整合营销规划',
  '2.2.3': '2.2.3 供应链管理',
  '2.2.4': '2.2.4 O2O管理',
  '2.2.5': '2.2.5 财务解决方案',
  '2.3': '2.3 客户生意规划',
  '2.4': '2.4 财务敏锐度',
  '3.1': '3.1 高效沟通技巧',
  '3.2': '3.2 讲述价值故事',
  '4.1': '4.1 问题解决技巧',
  '4.2': '4.2 复杂局面研判',
  '4.3': '4.3 解决谈判阻力',
  '4.4': '4.4 财务价值导向',
  '5.1': '5.1 以客户为中心',
  '5.2': '5.2 现有客户维护',
  '5.3': '5.3 潜在客户开发',
  '6.1': '6.1 驱动追求成就',
  '6.2': '6.2 卓越完美执行',
  '6.3': '6.3 打造高绩效团队',
  '7.1': '7.1 战略思维',
  '7.2': '7.2 学习创新',
  '7.3': '7.3 主人翁精神',
  '7.4': '7.4 使用数字化工具'
}

// 工具：提取子能力键（如 "1.1 从数据到洞察" -> "1.1"）
export const extractSubCapabilityKey = (text) => {
  if (!text || typeof text !== 'string') return null
  const m = text.match(/^(\d+(?:\.\d+)+)/)
  return m ? m[1] : null
}

// 工具：根据子能力键推导主能力键（如 "4.1" -> "4"）
export const getCapabilityKeyFromSub = (subKey) => {
  if (!subKey || typeof subKey !== 'string') return null
  const m = subKey.match(/^([1-7])\./)
  return m ? m[1] : null
}

// 难度映射
const mapDifficulty = (d) => {
  if (d === '易') return 'easy'
  if (d === '中') return 'medium'
  if (d === '难') return 'hard'
  return 'medium'
}

// 将 Markdown 文本解析为题库与场景
export function parseQuestionBankFromText(content) {
  const lines = content.split('\n')
  const scenarios = []
  const questions = []

  let isScenarioSection = false
  let currentChannel = 'omnichannel'
  let currentScenario = null
  let currentQuestion = null
  let isParsingScenarioDescription = false
  let globalQuestionNumber = 0

  const pushCurrentScenario = () => {
    if (currentScenario) {
      if (currentQuestion) {
        currentScenario.questions.push(currentQuestion)
        currentQuestion = null
      }
      currentScenario.description = (currentScenario.description || '').trim()
      if (currentScenario.questions.length > 0) {
        currentScenario.endQuestion = currentScenario.startQuestion + currentScenario.questions.length - 1
      }
      scenarios.push(currentScenario)
      currentScenario = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] || '').trim()
    if (!line) continue

    // 进入场景/非场景
    if (line === '# 场景题') { isScenarioSection = true; continue }
    if (line === '# 非场景题') { isScenarioSection = false; pushCurrentScenario(); continue }

    if (isScenarioSection) {
      // 渠道标题
      if (line.startsWith('## ')) {
        pushCurrentScenario()
        const channelName = line.substring(3).trim()
        currentChannel = CHANNEL_MAPPING[channelName] || 'omnichannel'
        continue
      }

      // 场景标题
      if (line.startsWith('### ')) {
        pushCurrentScenario()
        const scenarioTitle = line.substring(4).trim()
        const m = scenarioTitle.match(/场景(\d+)/)
        const order = m ? parseInt(m[1]) : (scenarios.length + 1)
        const scenarioId = `scenario_${currentChannel}_${order}` // 保持统一：scenario_<channel>_<n>
        currentScenario = {
          id: scenarioId,
          title: scenarioTitle,
          channel: currentChannel,
          description: '',
          order,
          questions: [],
          startQuestion: globalQuestionNumber + 1,
          endQuestion: globalQuestionNumber + 1
        }
        isParsingScenarioDescription = true
        continue
      }

      // 题目开始：格式如 "第X题（难度）- 能力点"
      const qMatch = line.match(/^第(\d+)题（(.+?)）\s*-\s*(.+)$/)
      if (qMatch) {
        isParsingScenarioDescription = false
        // 收尾上一个题
        if (currentQuestion && currentScenario) {
          currentScenario.questions.push(currentQuestion)
          currentQuestion = null
        }

        globalQuestionNumber++
        const localNumber = parseInt(qMatch[1])
        const difficultyRaw = qMatch[2]
        const capabilityText = qMatch[3]

        let processed = capabilityText
        if (processed.includes(' + ')) {
          processed = processed.split(' + ')[0].trim()
        }

        // 提取子能力键与主能力
        let subKey = extractSubCapabilityKey(processed)
        let capKey = getCapabilityKeyFromSub(subKey)
        let capabilityName = capKey ? (CAPABILITIES[capKey] || capKey) : processed
        let subCapName = subKey ? (SUB_CAPABILITIES[subKey] || processed) : processed

        // 构造题目
        currentQuestion = {
          id: `question_${currentChannel}_${currentScenario?.order || 0}_${localNumber}`,
          content: '',
          options: [],
          correctAnswer: 0,
          correctAnswers: [],
          difficulty: mapDifficulty(difficultyRaw),
          capability: capabilityName,
          subCapability: subKey || processed,
          subCapabilityName: subCapName,
          explanation: '',
          category: 'professional',
          questionType: 'scenario',
          source: 'scenario',
          channel: currentChannel,
          scenarioId: currentScenario ? currentScenario.id : null,
          scenarioTitle: currentScenario ? currentScenario.title : '',
          scenarioOrder: currentScenario ? currentScenario.order : null,
          questionNumber: globalQuestionNumber,
          localQuestionNumber: localNumber,
          isMultipleChoice: false
        }
        continue
      }

      // 场景描述段落
      if (isParsingScenarioDescription && currentScenario) {
        currentScenario.description += line + '\n'
        continue
      }

      // 题目内容
      if (currentQuestion) {
        // 题干（不是选项/答案/解析等）
        if (!currentQuestion.content && 
            !line.match(/^[A-E]\./) &&
            !line.startsWith('答案：') &&
            !line.startsWith('解析：') &&
            !line.startsWith('正确答案：') &&
            !line.startsWith('选项分析：') &&
            !line.match(/^#{1,3}\s/)) {
          currentQuestion.content = line
          continue
        }

        // 选项
        const optMatch = line.match(/^([A-E])\.\s*(.+)$/)
        if (optMatch) {
          const letter = optMatch[1]
          let text = optMatch[2].trim()
          if (text.includes('（多选）')) {
            text = text.replace('（多选）', '').trim()
            currentQuestion.isMultipleChoice = true
          }
          if (text.includes('（正确答案）')) {
            text = text.replace('（正确答案）', '').trim()
            const idx = ['A','B','C','D','E'].indexOf(letter)
            if (idx !== -1) {
              if (!currentQuestion.correctAnswers || currentQuestion.correctAnswers.length === 0) {
                currentQuestion.correctAnswer = idx
                currentQuestion.correctAnswers = [idx]
              } else {
                currentQuestion.correctAnswers.push(idx)
                currentQuestion.isMultipleChoice = true
              }
            }
          }
          currentQuestion.options.push(text)
          continue
        }

        // 正确答案
        if (line.startsWith('正确答案：') || line.startsWith('答案：')) {
          const ans = line.replace(/^(正确答案：|答案：)/, '').trim()
          const parts = ans.split(/[、,]/).map(a => a.trim()).filter(Boolean)
          const idxs = parts.map(a => ['A','B','C','D','E'].indexOf(a)).filter(i => i !== -1)
          if (idxs.length > 0) {
            currentQuestion.correctAnswer = idxs[0]
            currentQuestion.correctAnswers = idxs
            if (idxs.length > 1) currentQuestion.isMultipleChoice = true
          } else {
            const idx = ['A','B','C','D','E'].indexOf(ans)
            if (idx !== -1) {
              currentQuestion.correctAnswer = idx
              currentQuestion.correctAnswers = [idx]
              currentQuestion.isMultipleChoice = false
            }
          }
          continue
        }

        // 解析
        if (line.startsWith('选项分析：') || line.startsWith('解析：')) {
          currentQuestion.explanation = line.replace(/^(选项分析：|解析：)/, '').trim()
          continue
        }
      }
    } else {
      // 非场景题（可选）——格式：第X题，能力点，难度，
      // 处理非场景题中的渠道标题，如："## 全渠道"、"## CVS" 等
      if (line.startsWith('## ')) {
        // 在切换渠道前，如果有正在解析的题目，先入库
        if (currentQuestion && currentQuestion.source === 'non-scenario') {
          questions.push(currentQuestion)
          currentQuestion = null
        }
        const channelName = line.substring(3).trim()
        currentChannel = CHANNEL_MAPPING[channelName] || 'omnichannel'
        continue
      }

      const nsMatch = line.match(/^第(\d+)题，(.+?)，(.+?)，\s*$/)
      if (nsMatch) {
        if (currentQuestion) { questions.push(currentQuestion); currentQuestion = null }
        const qn = parseInt(nsMatch[1])
        const capText = nsMatch[2].trim()
        const diffRaw = nsMatch[3].trim()
        const subKey = extractSubCapabilityKey(capText)
        const capKey = getCapabilityKeyFromSub(subKey)
        const capName = capKey ? (CAPABILITIES[capKey] || capKey) : capText
        const subName = subKey ? (SUB_CAPABILITIES[subKey] || capText) : capText
        globalQuestionNumber++
        currentQuestion = {
          id: `non-scenario-${qn}`,
          content: '',
          options: [],
          correctAnswer: 0,
          correctAnswers: [],
          explanation: '',
          difficulty: mapDifficulty(diffRaw),
          capability: capName,
          subCapability: subKey || capText,
          subCapabilityName: subName,
          category: (currentChannel === 'omnichannel' ? 'general' : 'professional'),
          questionType: 'non-scenario',
          source: 'non-scenario',
          channel: currentChannel || 'omnichannel',
          scenarioId: null,
          scenarioTitle: '',
          questionNumber: globalQuestionNumber,
          isMultipleChoice: false,
          needsContent: true
        }
        continue
      }

      // 非场景题题干
      if (currentQuestion && currentQuestion.needsContent && 
          !line.match(/^[A-E]\./) && 
          !line.startsWith('正确答案：') && 
          !line.startsWith('答案：') &&
          !line.startsWith('选项分析：') && 
          !line.startsWith('解析：')) {
        currentQuestion.content = line
        currentQuestion.needsContent = false
        continue
      }

      // 非场景题选项
      if (currentQuestion) {
        const optMatch2 = line.match(/^([A-E])\.\s*(.+)$/)
        if (optMatch2) {
          const letter = optMatch2[1]
          let text = optMatch2[2].trim()
          if (text.includes('（多选）')) {
            text = text.replace('（多选）', '').trim()
            currentQuestion.isMultipleChoice = true
          }
          if (text.includes('（正确答案）')) {
            text = text.replace('（正确答案）', '').trim()
            const idx = ['A','B','C','D','E'].indexOf(letter)
            if (idx !== -1) {
              if (!currentQuestion.correctAnswers || currentQuestion.correctAnswers.length === 0) {
                currentQuestion.correctAnswer = idx
                currentQuestion.correctAnswers = [idx]
              } else {
                currentQuestion.correctAnswers.push(idx)
                currentQuestion.isMultipleChoice = true
              }
            }
          }
          currentQuestion.options.push(text)
          continue
        }

        // 非场景题答案
        if (line.startsWith('正确答案：') || line.startsWith('答案：')) {
          const ans = line.replace(/^(正确答案：|答案：)/, '').trim()
          const parts = ans.split(/[、,]/).map(a => a.trim()).filter(Boolean)
          const idxs = parts.map(a => ['A','B','C','D','E'].indexOf(a)).filter(i => i !== -1)
          if (idxs.length > 0) {
            currentQuestion.correctAnswer = idxs[0]
            currentQuestion.correctAnswers = idxs
            if (idxs.length > 1) currentQuestion.isMultipleChoice = true
          } else {
            const idx = ['A','B','C','D','E'].indexOf(ans)
            if (idx !== -1) {
              currentQuestion.correctAnswer = idx
              currentQuestion.correctAnswers = [idx]
              currentQuestion.isMultipleChoice = false
            }
          }
          continue
        }

        // 非场景题解析
        if (line.startsWith('选项分析：') || line.startsWith('解析：')) {
          currentQuestion.explanation = line.replace(/^(选项分析：|解析：)/, '').trim()
          continue
        }
      }
    }
  }

  // 收尾最后一个场景/题目
  if (isScenarioSection) {
    if (currentQuestion && currentScenario) {
      currentScenario.questions.push(currentQuestion)
      currentQuestion = null
    }
    pushCurrentScenario()
  } else if (currentQuestion) {
    questions.push(currentQuestion)
  }

  // 扁平化：将场景题也加入总题库
  scenarios.forEach(s => {
    if (Array.isArray(s.questions)) {
      questions.push(...s.questions)
    }
  })

  return { SCENARIOS: scenarios, QUESTION_BANK: questions }
}

export default parseQuestionBankFromText