import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  QUESTION_BANK, 
  SCENARIOS, 
  CAPABILITIES, 
  SUB_CAPABILITIES, 
  CHANNELS,
  DATA_VERSION,
  getQuestionsByChannel,
  getQuestionsByCapability,
  getScenarioQuestions,
  getNonScenarioQuestions,
  getQuestionsByCategory
} from '../data/questionBank'
import { TestGenerationService } from '../utils/testGenerationService'

const QuestionContext = createContext()

export const useQuestions = () => {
  const context = useContext(QuestionContext)
  if (!context) {
    throw new Error('useQuestions must be used within a QuestionProvider')
  }
  return context
}

export const QuestionProvider = ({ children }) => {
  const [questions, setQuestions] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [results, setResults] = useState([])
  const [scenarios, setScenarios] = useState(SCENARIOS)
  
  // 评分权重配置（T1）
  const SCORE_WEIGHTS = {
    single: { easy: 1, medium: 1.5, hard: 2 },
    multi: { easy: 2, medium: 3, hard: 4 }
  }

  // 工具：判断多选题是否全对
  const isMultiAnswerCorrect = (userAnswerArray = [], correctAnswerArray = []) => {
    if (!Array.isArray(userAnswerArray) || !Array.isArray(correctAnswerArray)) return false
    if (userAnswerArray.length !== correctAnswerArray.length) return false
    const a = [...userAnswerArray].sort((x, y) => x - y)
    const b = [...correctAnswerArray].sort((x, y) => x - y)
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  }

  // 工具：根据 subCapability 计算所属能力 key（例如 "4.1" -> "4"）
  const getCapabilityKeyFromSub = (subCapKey) => {
    if (!subCapKey || typeof subCapKey !== 'string') return null
    const match = subCapKey.match(/^([1-7])\./)
    return match ? match[1] : null
  }

  // 工具：提取子能力的键（例如 "1.1 从数据到洞察" -> "1.1"；"2.2.4 O2O管理" -> "2.2.4"）
  const extractSubCapabilityKey = (text) => {
    if (!text || typeof text !== 'string') return null
    const m = text.match(/^(\d+(?:\.\d+)+)/)
    return m ? m[1] : null
  }

  // 初始化题库数据
  useEffect(() => {
    const savedQuestions = localStorage.getItem('coca_cola_questions')
    const savedScenarios = localStorage.getItem('coca_cola_scenarios')
    const savedVersion = localStorage.getItem('coca_cola_data_version')

    const shouldRefresh = savedVersion !== DATA_VERSION

    if (savedQuestions && !shouldRefresh) {
      setQuestions(JSON.parse(savedQuestions))
    } else {
      // 使用新的题库数据（刷新本地缓存）
      setQuestions(QUESTION_BANK)
      localStorage.setItem('coca_cola_questions', JSON.stringify(QUESTION_BANK))
    }

    if (savedScenarios && !shouldRefresh) {
      setScenarios(JSON.parse(savedScenarios))
    } else {
      setScenarios(SCENARIOS)
      localStorage.setItem('coca_cola_scenarios', JSON.stringify(SCENARIOS))
    }

    // 更新数据版本，确保未来自动刷新
    localStorage.setItem('coca_cola_data_version', DATA_VERSION)

    const savedQuizzes = localStorage.getItem('coca_cola_quizzes')
    if (savedQuizzes) {
      setQuizzes(JSON.parse(savedQuizzes))
    }

    // 读取结果（含旧键迁移）
    const savedResults = localStorage.getItem('coca_cola_results')
    const legacyResults = localStorage.getItem('testResults')
    if (savedResults) {
      try {
        setResults(JSON.parse(savedResults))
      } catch (e) {
        console.warn('解析 coca_cola_results 失败:', e)
        setResults([])
      }
    } else if (legacyResults) {
      // 旧数据迁移：尽量保留原字段，并补齐基本结构
      try {
        const legacy = JSON.parse(legacyResults)
        const migrated = Array.isArray(legacy) ? legacy.map((r) => {
          const totalQuestions = r.totalQuestions || (r.questionResults ? r.questionResults.length : 0) || 0
          const correctAnswers = r.correctAnswers ?? 0
          const earnedScore = correctAnswers // 旧版每题 1 分
          const totalPossibleScore = totalQuestions
          const scoreRateRaw = totalPossibleScore > 0 ? (earnedScore / totalPossibleScore) * 100 : 0
          const scoreRate = Math.round(scoreRateRaw)
          return {
            ...r,
            // 保持旧版接口字段
            score: (typeof r.score === 'string' || typeof r.score === 'number') ? r.score : scoreRateRaw.toFixed(1),
            // 新版 totals/analysis 结构（最小化迁移）
            totals: {
              totalQuestions,
              totalPossibleScore,
              earnedScore,
              scoreRateRaw,
              scoreRate
            },
            analysis: {
              capabilities: {},
              subCapabilities: {},
              difficulty: {}
            },
            userInfo: r.userInfo || null,
            completedAt: r.completedAt || new Date().toISOString()
          }
        }) : []
        setResults(migrated)
        localStorage.setItem('coca_cola_results', JSON.stringify(migrated))
        localStorage.removeItem('testResults')
        console.log('已迁移旧键 testResults → coca_cola_results，条目数:', migrated.length)
      } catch (e) {
        console.warn('迁移旧键 testResults 失败:', e)
      }
    }
  }, [])

  // 生成测验
  const generateQuiz = () => {
    if (!questions || questions.length === 0) {
      throw new Error('题库为空，请先导入题目')
    }
    
    const professionalQuestions = questions.filter(q => q.category === 'professional')
    const generalQuestions = questions.filter(q => q.category === 'general')
    
    // 选择专业题目（最多40道）
    const selectedProfessional = professionalQuestions.slice(0, 40)
    
    // 随机选择通用题目（最多20道）
    const shuffledGeneral = [...generalQuestions].sort(() => Math.random() - 0.5)
    const selectedGeneral = shuffledGeneral.slice(0, 20)
    
    const quizQuestions = [...selectedProfessional, ...selectedGeneral]
    
    if (quizQuestions.length === 0) {
      throw new Error('没有可用的题目生成测验')
    }
    
    const quiz = {
      id: `quiz_${Date.now()}`,
      questions: quizQuestions,
      createdAt: new Date().toISOString(),
      completed: false
    }
    
    const updatedQuizzes = [...quizzes, quiz]
    setQuizzes(updatedQuizzes)
    localStorage.setItem('coca_cola_quizzes', JSON.stringify(updatedQuizzes))
    
    return quiz
  }

  // 提交测验答案
  const submitQuiz = (quizId, answers, userId) => {
    const quiz = quizzes.find(q => q.id === quizId)
    if (!quiz) return null
    
    // 逐题得分计算与结果结构扩展（T1）
    let totalPossibleScore = 0
    let earnedScore = 0
    let correctCount = 0

    // 聚合缓存
    const capabilityAgg = {} // key: '1'..'7'
    const subCapabilityAgg = {} // key: '1.1' 等
    const difficultyAgg = { easy: { total: 0, correct: 0, possible: 0, earned: 0 }, medium: { total: 0, correct: 0, possible: 0, earned: 0 }, hard: { total: 0, correct: 0, possible: 0, earned: 0 } }

    const questionResults = quiz.questions.map((question, index) => {
      const userAnswer = answers[index]
      const isMulti = !!question.isMultipleChoice
      const difficulty = question.difficulty || 'easy'
      const weight = (isMulti ? SCORE_WEIGHTS.multi : SCORE_WEIGHTS.single)[difficulty] || 1
      const possibleScore = weight
      let isCorrect = false

      if (isMulti) {
        isCorrect = isMultiAnswerCorrect(userAnswer, question.correctAnswers)
      } else {
        isCorrect = userAnswer === question.correctAnswer
      }

      const earned = isCorrect ? possibleScore : 0
      // 更新累计
      totalPossibleScore += possibleScore
      earnedScore += earned
      if (isCorrect) correctCount++

      // 难度聚合
      if (difficultyAgg[difficulty]) {
        difficultyAgg[difficulty].total += 1
        difficultyAgg[difficulty].correct += isCorrect ? 1 : 0
        difficultyAgg[difficulty].possible += possibleScore
        difficultyAgg[difficulty].earned += earned
      }

      // 能力与子能力聚合（标准化子能力键）
      const subKeyRaw = question.subCapability || null
      const subKey = extractSubCapabilityKey(subKeyRaw)
      const capKey = getCapabilityKeyFromSub(subKey)
      if (capKey) {
        if (!capabilityAgg[capKey]) {
          capabilityAgg[capKey] = { key: capKey, name: CAPABILITIES[capKey] || capKey, totalQuestions: 0, totalPossibleScore: 0, earnedScore: 0 }
        }
        capabilityAgg[capKey].totalQuestions += 1
        capabilityAgg[capKey].totalPossibleScore += possibleScore
        capabilityAgg[capKey].earnedScore += earned
      }
      if (subKey) {
        if (!subCapabilityAgg[subKey]) {
          subCapabilityAgg[subKey] = {
            key: subKey,
            name: SUB_CAPABILITIES[subKey] || (subKeyRaw || subKey),
            totalQuestions: 0,
            totalPossibleScore: 0,
            earnedScore: 0
          }
        }
        subCapabilityAgg[subKey].totalQuestions += 1
        subCapabilityAgg[subKey].totalPossibleScore += possibleScore
        subCapabilityAgg[subKey].earnedScore += earned
      }

      return {
        questionId: question.id,
        question: question.content,
        userAnswer,
        correctAnswer: isMulti ? question.correctAnswers : question.correctAnswer,
        isCorrect,
        options: question.options,
        explanation: question.explanation,
        difficulty: question.difficulty,
        isMultipleChoice: isMulti,
        possibleScore,
        earnedScore: earned,
        // 标准化后的子能力键与名称
        subCapabilityKey: subKey || null,
        subCapability: subKey || null,
        capabilityKey: capKey,
        capabilityName: capKey ? (CAPABILITIES[capKey] || capKey) : null,
        // 兼容旧的 Results.jsx 统计逻辑（answer.capability）
        capability: capKey ? (CAPABILITIES[capKey] || capKey) : null,
        subCapabilityName: subKey ? (SUB_CAPABILITIES[subKey] || subKeyRaw || subKey) : (subKeyRaw || null)
      }
    })

    const scoreRateRaw = totalPossibleScore > 0 ? (earnedScore / totalPossibleScore) * 100 : 0
    const scoreRate = Math.round(scoreRateRaw)

    // 整理聚合结构，补充得分率
    const capabilities = {}
    Object.keys(capabilityAgg).forEach((k) => {
      const item = capabilityAgg[k]
      const rateRaw = item.totalPossibleScore > 0 ? (item.earnedScore / item.totalPossibleScore) * 100 : 0
      capabilities[k] = { ...item, scoreRateRaw: rateRaw, scoreRate: Math.round(rateRaw) }
    })
    const subCapabilities = {}
    Object.keys(subCapabilityAgg).forEach((k) => {
      const item = subCapabilityAgg[k]
      const rateRaw = item.totalPossibleScore > 0 ? (item.earnedScore / item.totalPossibleScore) * 100 : 0
      subCapabilities[k] = { ...item, scoreRateRaw: rateRaw, scoreRate: Math.round(rateRaw) }
    })
    const difficultyStats = ['easy', 'medium', 'hard'].map((d) => {
      const s = difficultyAgg[d]
      const accuracyRaw = s.total > 0 ? (s.correct / s.total) * 100 : 0
      const rateRaw = s.possible > 0 ? (s.earned / s.possible) * 100 : 0
      return {
        difficulty: d,
        total: s.total,
        correct: s.correct,
        accuracy: accuracyRaw.toFixed(1),
        possibleScore: s.possible,
        earnedScore: s.earned,
        scoreRateRaw: rateRaw,
        scoreRate: Math.round(rateRaw)
      }
    })

    const result = {
      id: `result_${Date.now()}`,
      quizId,
      userId,
      userInfo: quiz.userInfo || null,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
      score: scoreRateRaw.toFixed(1), // 保持旧字段含义：百分比字符串
      totals: {
        totalQuestions: quiz.questions.length,
        totalPossibleScore,
        earnedScore,
        scoreRateRaw,
        scoreRate // 取整显示用
      },
      questionResults,
      analysis: {
        capabilities,
        subCapabilities,
        difficulty: difficultyStats
      },
      completedAt: new Date().toISOString()
    }

    const updatedResults = [...results, result]
    setResults(updatedResults)
    localStorage.setItem('coca_cola_results', JSON.stringify(updatedResults))

    // 标记测验为已完成
    const updatedQuizzes = quizzes.map(q => 
      q.id === quizId ? { ...q, completed: true } : q
    )
    setQuizzes(updatedQuizzes)
    localStorage.setItem('coca_cola_quizzes', JSON.stringify(updatedQuizzes))

    return result
  }

  // 添加题目
  const addQuestion = (question) => {
    const newQuestion = {
      ...question,
      id: `custom_${Date.now()}`,
    }
    const updatedQuestions = [...questions, newQuestion]
    setQuestions(updatedQuestions)
    localStorage.setItem('coca_cola_questions', JSON.stringify(updatedQuestions))
  }

  // 更新题目
  const updateQuestion = (questionId, updatedQuestion) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, ...updatedQuestion } : q
    )
    setQuestions(updatedQuestions)
    localStorage.setItem('coca_cola_questions', JSON.stringify(updatedQuestions))
  }

  // 删除题目
  const deleteQuestion = (questionId) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId)
    setQuestions(updatedQuestions)
    localStorage.setItem('coca_cola_questions', JSON.stringify(updatedQuestions))
  }

  // 批量导入题目
  const bulkImportQuestions = (data) => {
    const { questions: importedQuestions, scenarios: importedScenarios } = data;

    const newQuestions = importedQuestions.map((q, index) => ({
      ...q,
      id: `imported_${Date.now()}_${index}`,
    }));
    const updatedQuestions = [...questions, ...newQuestions];
    setQuestions(updatedQuestions);
    localStorage.setItem('coca_cola_questions', JSON.stringify(updatedQuestions));

    const newScenarios = importedScenarios.map((s, index) => ({
      ...s,
      id: `imported_scenario_${Date.now()}_${index}`,
    }));
    const updatedScenarios = [...scenarios, ...newScenarios];
    setScenarios(updatedScenarios);
    localStorage.setItem('coca_cola_scenarios', JSON.stringify(updatedScenarios));

    return { numQuestions: newQuestions.length, numScenarios: newScenarios.length };
  };

  // 添加场景
  const addScenario = (scenario) => {
    const newScenario = {
      ...scenario,
      id: `scenario_${Date.now()}`,
    };
    const updatedScenarios = [...scenarios, newScenario];
    setScenarios(updatedScenarios);
    localStorage.setItem('coca_cola_scenarios', JSON.stringify(updatedScenarios));
  };

  // 更新场景
  const updateScenario = (scenarioId, updatedScenario) => {
    const updatedScenarios = scenarios.map(s => 
      s.id === scenarioId ? { ...s, ...updatedScenario } : s
    )
    setScenarios(updatedScenarios)
    localStorage.setItem('coca_cola_scenarios', JSON.stringify(updatedScenarios))
  }

  // 删除场景
  const deleteScenario = (scenarioId) => {
    const updatedScenarios = scenarios.filter(s => s.id !== scenarioId)
    setScenarios(updatedScenarios)
    localStorage.setItem('coca_cola_scenarios', JSON.stringify(updatedScenarios))
  }

  // 根据题目序号获取对应场景
  const getScenarioForQuestion = (questionNumber) => {
    if (!scenarios || !Array.isArray(scenarios)) return null;
    
    // 题目序号从0开始，场景题是前30题（0-29）
    if (questionNumber >= 30) return null;
    
    // 每5题一个场景，计算场景索引
    const scenarioIndex = Math.floor(questionNumber / 5);
    
    // 获取对应的场景
    if (scenarioIndex < scenarios.length) {
      return scenarios[scenarioIndex];
    }
    
    return null;
  };

  // 清空所有题库数据
  const clearAllData = () => {
    setQuestions([]);
    setScenarios([]);
    setQuizzes([]);
    setResults([]);
    
    // 清空 localStorage
    localStorage.removeItem('coca_cola_questions');
    localStorage.removeItem('coca_cola_scenarios');
    localStorage.removeItem('coca_cola_quizzes');
    localStorage.removeItem('coca_cola_results');
    
    return true;
  };
  // 解析Word文档内容
  const parseWordContent = (content) => {
    // 这里可以添加Word文档解析逻辑
    // 目前返回示例格式
    return []
  }

  // 解析Markdown内容 - 基于工作版本的修复
  const parseMarkdownContent = (content) => {
    const lines = content.split('\n');
    const scenarios = [];
    const questions = [];
    let currentScenario = null;
    let currentQuestion = null;
    let isParsingScenarioDescription = false;
    let isScenarioSection = false;
    let currentChannel = 'omnichannel';
    let questionCounter = 0;
    let globalQuestionNumber = 0;

    console.log('=== 开始解析Markdown内容 ===');
    console.log('总行数:', lines.length);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查是否进入场景题部分
      if (line === '# 场景题') {
        isScenarioSection = true;
        console.log('进入场景题部分');
        continue;
      }
      
      // 检查是否进入非场景题部分
      if (line === '# 非场景题') {
        isScenarioSection = false;
        // 保存最后一个场景
        if (currentScenario) {
          if (currentQuestion) {
            currentScenario.questions.push(currentQuestion);
            currentQuestion = null;
          }
          currentScenario.description = currentScenario.description.trim();
          if (currentScenario.questions.length > 0) {
            currentScenario.endQuestion = currentScenario.startQuestion + currentScenario.questions.length - 1;
          }
          scenarios.push(currentScenario);
          currentScenario = null;
        }
        console.log('进入非场景题部分');
        continue;
      }
    
      if (isScenarioSection) {
        // 解析渠道
        if (line.startsWith('## ')) {
          // 保存上一个场景（如果存在）
          if (currentScenario) {
            if (currentQuestion) {
              currentScenario.questions.push(currentQuestion);
              currentQuestion = null;
            }
            currentScenario.description = currentScenario.description.trim();
            if (currentScenario.questions.length > 0) {
              currentScenario.endQuestion = currentScenario.startQuestion + currentScenario.questions.length - 1;
            }
            scenarios.push(currentScenario);
            currentScenario = null;
          }
          
          const channelName = line.substring(3).trim();
          const channelMapping = {
            'CVS': 'cvs',
            '大卖场/超市': 'hypermarket',
            '电商': 'ecommerce',
            'E&D': 'ed',
            '特殊渠道': 'special',
            '全渠道': 'omnichannel'
          };
          currentChannel = channelMapping[channelName] || 'omnichannel';
          console.log('切换到渠道:', channelName, '->', currentChannel);
          continue;
        }
        
        // 解析场景标题
        if (line.startsWith('### ')) {
          if (currentScenario) {
            if (currentQuestion) {
              currentScenario.questions.push(currentQuestion);
              currentQuestion = null;
            }
            currentScenario.description = currentScenario.description.trim();
            if (currentScenario.questions.length > 0) {
              currentScenario.endQuestion = currentScenario.startQuestion + currentScenario.questions.length - 1;
            }
            scenarios.push(currentScenario);
          }
          
          const scenarioTitle = line.substring(4).trim();
          const scenarioMatch = scenarioTitle.match(/场景(\d+)/);
          const scenarioNumber = scenarioMatch ? parseInt(scenarioMatch[1]) : scenarios.length + 1;
          
          currentScenario = {
            id: `scenario_${currentChannel}_${scenarioNumber}`,
            title: scenarioTitle,
            channel: currentChannel,
            description: '',
            order: scenarioNumber,
            questions: [],
            startQuestion: globalQuestionNumber + 1,
            endQuestion: globalQuestionNumber + 1
          };
          
          console.log('创建新场景:', currentScenario.id, currentScenario.title);
          isParsingScenarioDescription = true;
          continue;
        }

        // 检查是否是题目开始（格式：第X题（难度）- 能力点）
        const questionMatch = line.match(/^第(\d+)题（(.+?)）\s*-\s*(.+)/);
        if (questionMatch) {
          isParsingScenarioDescription = false;
          
          if (currentQuestion && currentScenario) {
            currentScenario.questions.push(currentQuestion);
          }
          
          globalQuestionNumber++;
          const localQuestionNumber = parseInt(questionMatch[1]);
          const difficulty = questionMatch[2];
          const capabilityText = questionMatch[3];
          
          let capability = capabilityText;
          let subCapability = '';
          let processedCapabilityText = capabilityText;
          
          if (capabilityText.includes(' + ')) {
            const parts = capabilityText.split(' + ');
            processedCapabilityText = parts[0].trim();
          }
          
          // 修复子能力项解析 - 处理有空格和无空格的格式（标准化子能力键）
          const capabilityMatch = processedCapabilityText.match(/^(\d+\.\d+)\s*(.*)$/);
          if (capabilityMatch) {
            const capabilityCode = capabilityMatch[1].trim();
            const capabilityName = capabilityMatch[2].trim();
            
            // 标准化子能力键（"1.1 从数据到洞察" -> "1.1"）
            const subKey = extractSubCapabilityKey(processedCapabilityText);
            subCapability = subKey || processedCapabilityText;
            
            // 根据编号确定主能力
            if (capabilityCode.startsWith('1.')) {
              capability = '1.全域洞察力';
            } else if (capabilityCode.startsWith('2.')) {
              capability = '2.方案规划力';
            } else if (capabilityCode.startsWith('3.')) {
              capability = '3.故事沟通力';
            } else if (capabilityCode.startsWith('4.')) {
              capability = '4.卖进谈判力';
            } else if (capabilityCode.startsWith('5.')) {
              capability = '5.客户发展力';
            } else if (capabilityCode.startsWith('6.')) {
              capability = '6.卓越执行力';
            } else if (capabilityCode.startsWith('7.')) {
              capability = '7.战略领导力';
            } else {
              capability = processedCapabilityText;
            }
          } else if (processedCapabilityText.includes('-')) {
            const parts = processedCapabilityText.split('-');
            capability = parts[0].trim();
            const subCandidate = parts[1].trim();
            const subKey = extractSubCapabilityKey(subCandidate);
            subCapability = subKey || subCandidate;
          }
          
          let mappedDifficulty = 'medium';
          if (difficulty === '易') mappedDifficulty = 'easy';
          else if (difficulty === '中') mappedDifficulty = 'medium';
          else if (difficulty === '难') mappedDifficulty = 'hard';
          
          if (currentScenario && currentScenario.questions.length === 0) {
            currentScenario.startQuestion = globalQuestionNumber;
          }
          
          // 生成场景ID
          let scenarioId = null;
          if (currentScenario) {
            scenarioId = `${currentChannel}_scenario_${currentScenario.order}`;
          }
          
          currentQuestion = {
            id: `question_${currentChannel}_${currentScenario?.order || 0}_${localQuestionNumber}`,
            content: '',
            options: [],
            correctAnswer: 0,
            correctAnswers: [],
            difficulty: mappedDifficulty,
            capability: capability,
            subCapability: subCapability,
            subCapabilityName: SUB_CAPABILITIES[subCapability] || processedCapabilityText,
            explanation: '',
            category: 'scenario',
            questionType: 'scenario',
            source: 'scenario',
            channel: currentChannel,
            scenarioId: scenarioId,
            scenarioTitle: currentScenario ? currentScenario.title : '',
            scenarioOrder: currentScenario ? currentScenario.order : null,
            questionNumber: globalQuestionNumber,
            localQuestionNumber: localQuestionNumber,
            isMultipleChoice: false
          };
          
          console.log('创建场景题目:', currentQuestion.id, '全局编号:', globalQuestionNumber);
          continue;
        }

        // 如果正在解析场景描述
        if (isParsingScenarioDescription && currentScenario && line) {
          currentScenario.description += line + '\n';
          continue;
        }

        // 如果正在解析问题内容
        if (currentQuestion) {
          // 首先检查题目内容 - 必须在所有其他检查之前
          if (!currentQuestion.content && line && 
              !line.match(/^[A-E]\./) && 
              !line.startsWith('答案：') && 
              !line.startsWith('解析：') &&
              !line.startsWith('正确答案：') &&
              !line.startsWith('选项分析：') &&
              !line.match(/^\d+\.\d+/) && // 避免能力项编号
              !line.match(/^[A-E][正错误]：/) && // 避免选项分析
              !line.match(/^(易|中|难)$/) && // 避免单独的难度描述
              !line.match(/^#{1,3}\s/) && // 不是标题
              line.trim().length > 5) { // 降低长度要求，移除问号要求
            currentQuestion.content = line.trim();
            continue;
          }

          // 检查选项（A. B. C. D.）
          const optionMatch = line.match(/^([A-E])\.\s*(.+)/);
          if (optionMatch) {
            const optionText = optionMatch[2];
            const optionLetter = optionMatch[1];
            
            if (optionText.includes('（正确答案）')) {
              const cleanOptionText = optionText.replace('（正确答案）', '').trim();
              currentQuestion.options.push(cleanOptionText);
              
              const answerIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(optionLetter);
              if (answerIndex !== -1) {
                if (!currentQuestion.correctAnswers) {
                  currentQuestion.correctAnswers = [];
                }
                if (currentQuestion.correctAnswers.length === 0) {
                  currentQuestion.correctAnswer = answerIndex;
                  currentQuestion.correctAnswers.push(answerIndex);
                } else {
                  currentQuestion.correctAnswers.push(answerIndex);
                  currentQuestion.isMultipleChoice = true;
                }
              }
            } else if (optionText.includes('（多选）')) {
              const cleanOptionText = optionText.replace('（多选）', '').trim();
              currentQuestion.options.push(cleanOptionText);
              currentQuestion.isMultipleChoice = true;
            } else {
              currentQuestion.options.push(optionText);
            }
            continue;
          }
          
          // 检查正确答案
          if (line.startsWith('正确答案：') || line.startsWith('答案：')) {
            const answer = line.replace(/^(正确答案：|答案：)/, '').trim();
            if (answer.includes('、') || answer.includes(',')) {
              const answers = answer.split(/[、,]/).map(a => a.trim());
              const answerIndices = answers.map(a => ['A', 'B', 'C', 'D', 'E'].indexOf(a)).filter(i => i !== -1);
              if (answerIndices.length > 0) {
                currentQuestion.correctAnswer = answerIndices[0];
                currentQuestion.correctAnswers = answerIndices;
                if (answerIndices.length > 1) {
                  currentQuestion.isMultipleChoice = true;
                }
              }
            } else {
              const answerIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(answer);
              if (answerIndex !== -1) {
                currentQuestion.correctAnswer = answerIndex;
                currentQuestion.correctAnswers = [answerIndex];
                currentQuestion.isMultipleChoice = false;
              }
            }
            continue;
          }
          
          // 检查解析
          if (line.startsWith('选项分析：') || line.startsWith('解析：')) {
            currentQuestion.explanation = line.replace(/^(选项分析：|解析：)/, '').trim();
            continue;
          }
          
          // 继续收集解析内容 - 修复：允许收集选项分析行（A错误：、B正确：等）
          if (currentQuestion.explanation !== undefined && line && 
              !line.match(/^第\d+题/) && 
              !line.match(/^[A-E]\./) && 
              !line.startsWith('正确答案：') && 
              !line.startsWith('答案：') &&
              !line.startsWith('选项分析：') &&
              !line.startsWith('解析：') &&
              !line.match(/^#{1,3}\s/) &&
              line.trim().length > 0) {
            currentQuestion.explanation += '\n' + line;
            continue;
          }
        }
      } else {
        // 处理非场景题
        const channelMatch = line.match(/^##\s*(.+)$/);
        if (channelMatch) {
          const channelName = channelMatch[1].trim();
          if (channelName === '全渠道') {
            currentChannel = 'omnichannel';
          } else if (channelName === '大卖场/超市') {
            currentChannel = 'hypermarket';
          } else if (channelName === '电商') {
            currentChannel = 'ecommerce';
          } else if (channelName === '特殊渠道') {
            currentChannel = 'special';
          } else if (channelName === 'CVS') {
            currentChannel = 'cvs';
          } else if (channelName === 'E&D') {
            currentChannel = 'ed';
          } else {
            currentChannel = 'omnichannel';
          }
          continue;
        }
        
        // 检查是否是题目开始
        const nonScenarioQuestionMatch = line.match(/^第(\d+)题，(.+?)，(.+?)，\s*$/);
        if (nonScenarioQuestionMatch) {
          if (currentQuestion) {
            questions.push(currentQuestion);
          }
          
          const questionNumber = parseInt(nonScenarioQuestionMatch[1]);
          const capability = nonScenarioQuestionMatch[2].trim();
          const difficulty = nonScenarioQuestionMatch[3].trim();
          
          let mappedDifficulty = 'medium';
          if (difficulty === '易') mappedDifficulty = 'easy';
          else if (difficulty === '中') mappedDifficulty = 'medium';
          else if (difficulty === '难') mappedDifficulty = 'hard';
          
          questionCounter++;
          globalQuestionNumber++;
          
          // 解析能力点和子能力项（格式：主能力-子能力或主能力.子能力）
          let parsedCapability = capability;
          let subCapability = '';
          let subCapabilityNameResolved = '';
          if (capability.includes('-')) {
            const parts = capability.split('-');
            parsedCapability = parts[0].trim();
            const subCandidate = parts[1].trim();
            const subKey = extractSubCapabilityKey(subCandidate);
            subCapability = subKey || subCandidate;
            subCapabilityNameResolved = subCandidate;
          } else {
            // 修复非场景题的子能力项解析 - 处理有空格和无空格的格式
            const capabilityMatch = capability.match(/^(\d+\.\d+)\s*(.*)$/);
            if (capabilityMatch) {
              const capabilityCode = capabilityMatch[1].trim();
              const capabilityName = capabilityMatch[2].trim();
              
              // 标准化子能力键
              const subKey = extractSubCapabilityKey(capability);
              subCapability = subKey || capability;
              subCapabilityNameResolved = capability;
              
              // 根据编号确定主能力
              if (capabilityCode.startsWith('1.')) {
                parsedCapability = '1.全域洞察力';
              } else if (capabilityCode.startsWith('2.')) {
                parsedCapability = '2.方案规划力';
              } else if (capabilityCode.startsWith('3.')) {
                parsedCapability = '3.故事沟通力';
              } else if (capabilityCode.startsWith('4.')) {
                parsedCapability = '4.卖进谈判力';
              } else if (capabilityCode.startsWith('5.')) {
                parsedCapability = '5.客户发展力';
              } else if (capabilityCode.startsWith('6.')) {
                parsedCapability = '6.卓越执行力';
              } else if (capabilityCode.startsWith('7.')) {
                parsedCapability = '7.战略领导力';
              }
            } else {
              // 兜底：尽力提取子能力键
              const subKey = extractSubCapabilityKey(capability);
              if (subKey) {
                subCapability = subKey;
                subCapabilityNameResolved = capability;
              }
            }
          }
          
          currentQuestion = {
            id: `non-scenario-${questionNumber}`,
            content: '',
            options: [],
            correctAnswer: 0,
            correctAnswers: [],
            explanation: '',
            difficulty: mappedDifficulty,
            capability: parsedCapability,
            subCapability: subCapability,
            subCapabilityName: SUB_CAPABILITIES[subCapability] || subCapabilityNameResolved,
            category: 'non-scenario',
            questionType: 'non-scenario',
            source: 'non-scenario',
            channel: currentChannel || 'omnichannel',
            scenarioId: null,
            scenarioTitle: '',
            questionNumber: globalQuestionNumber,
            isMultipleChoice: false,
            needsContent: true
          };
          continue;
        }

        // 处理非场景题的选项、答案、解析
        if (currentQuestion) {
          if (currentQuestion.needsContent && line.trim() && 
              !line.match(/^[A-E]\./) && 
              !line.startsWith('正确答案：') && 
              !line.startsWith('答案：') &&
              !line.startsWith('选项分析：') &&
              !line.startsWith('解析：')) {
            currentQuestion.content = line.trim();
            currentQuestion.needsContent = false;
            continue;
          }
          
          const optionMatch = line.match(/^([A-E])\.\s*(.+)/);
          if (optionMatch) {
            const optionText = optionMatch[2];
            const optionLetter = optionMatch[1];
            
            if (optionText.includes('（正确答案）')) {
              const cleanOptionText = optionText.replace('（正确答案）', '').trim();
              currentQuestion.options.push(cleanOptionText);
              
              const answerIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(optionLetter);
              if (answerIndex !== -1) {
                if (!currentQuestion.correctAnswers) {
                  currentQuestion.correctAnswers = [];
                }
                if (currentQuestion.correctAnswers.length === 0) {
                  currentQuestion.correctAnswer = answerIndex;
                  currentQuestion.correctAnswers.push(answerIndex);
                } else {
                  currentQuestion.correctAnswers.push(answerIndex);
                  currentQuestion.isMultipleChoice = true;
                }
              }
            } else if (optionText.includes('（多选）')) {
              const cleanOptionText = optionText.replace('（多选）', '').trim();
              currentQuestion.options.push(cleanOptionText);
              currentQuestion.isMultipleChoice = true;
            } else {
              currentQuestion.options.push(optionText);
            }
            continue;
          }
          
          if (line.startsWith('正确答案：') || line.startsWith('答案：')) {
            const answer = line.replace(/^(正确答案：|答案：)/, '').trim();
            if (answer.includes('、') || answer.includes(',')) {
              const answers = answer.split(/[、,]/).map(a => a.trim());
              const answerIndices = answers.map(a => ['A', 'B', 'C', 'D', 'E'].indexOf(a)).filter(i => i !== -1);
              if (answerIndices.length > 0) {
                currentQuestion.correctAnswer = answerIndices[0];
                currentQuestion.correctAnswers = answerIndices;
                if (answerIndices.length > 1) {
                  currentQuestion.isMultipleChoice = true;
                }
              }
            } else {
              const answerIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(answer);
              if (answerIndex !== -1) {
                currentQuestion.correctAnswer = answerIndex;
                currentQuestion.correctAnswers = [answerIndex];
                currentQuestion.isMultipleChoice = false;
              }
            }
            continue;
          }
          
          if (line.startsWith('选项分析：') || line.startsWith('解析：')) {
            currentQuestion.explanation = line.replace(/^(选项分析：|解析：)/, '').trim();
            continue;
          }
          
          if (currentQuestion.explanation && line && 
              !line.match(/^第\d+题/) && 
              !line.match(/^[A-E]\./) && 
              !line.startsWith('正确答案：') && 
              !line.startsWith('答案：') &&
              !line.startsWith('选项分析：') &&
              !line.startsWith('解析：') &&
              !line.match(/^#{1,3}\s/) &&
              line.trim().length > 0) {
            currentQuestion.explanation += '\n' + line;
            continue;
          }
        }
      }
    }
    
    // 保存最后的场景和问题
    if (currentScenario) {
      if (currentQuestion) {
        currentScenario.questions.push(currentQuestion);
      }
      currentScenario.description = currentScenario.description.trim();
      if (currentScenario.questions.length > 0) {
        currentScenario.endQuestion = currentScenario.startQuestion + currentScenario.questions.length - 1;
      }
      scenarios.push(currentScenario);
    }
    
    if (currentQuestion && !isScenarioSection) {
      questions.push(currentQuestion);
    }
    
    // 将场景中的问题添加到主问题列表
    scenarios.forEach(scenario => {
      questions.push(...scenario.questions);
    });
    
    console.log('解析完成:', {
      scenarios: scenarios.length,
      questions: questions.length,
      scenarioQuestions: scenarios.reduce((sum, s) => sum + s.questions.length, 0)
    });
    
    return { scenarios, questions };
  };

  // 新增：生成个性化测验
  const generatePersonalizedTest = (userInfo) => {
    try {
      const testService = new TestGenerationService(questions, scenarios)
      const test = testService.generatePersonalizedTest(userInfo)
      
      // 验证测验结构
      const validation = testService.validateTest(test)
      if (!validation.isValid) {
        console.warn('测验结构验证失败:', validation.issues)
      }
      
      // 保存测验到状态和localStorage
      const updatedQuizzes = [...quizzes, test]
      setQuizzes(updatedQuizzes)
      localStorage.setItem('coca_cola_quizzes', JSON.stringify(updatedQuizzes))
      
      return test
    } catch (error) {
      console.error('生成个性化测验失败:', error)
      throw error
    }
  }

  // 新增：获取测验统计信息
  const getTestStatistics = (testId) => {
    const test = quizzes.find(q => q.id === testId)
    if (!test) return null

    const { questions: testQuestions } = test
    
    // 统计各类题目数量
    const scenarioCount = testQuestions.filter((q, index) => index < 30).length
    const channelCount = testQuestions.filter((q, index) => index >= 30 && index < 40).length
    const omnichannelCount = testQuestions.filter((q, index) => index >= 40).length
    
    // 统计难度分布
    const difficultyStats = {
      easy: testQuestions.filter(q => q.difficulty === 'easy').length,
      medium: testQuestions.filter(q => q.difficulty === 'medium').length,
      hard: testQuestions.filter(q => q.difficulty === 'hard').length
    }
    
    // 统计能力分布
    const capabilityStats = {}
    CAPABILITIES.forEach(cap => {
      capabilityStats[cap] = testQuestions.filter(q => q.capability === cap).length
    })
    
    return {
      total: testQuestions.length,
      structure: {
        scenario: scenarioCount,
        channel: channelCount,
        omnichannel: omnichannelCount
      },
      difficulty: difficultyStats,
      capability: capabilityStats,
      userInfo: test.userInfo,
      timeLimit: test.timeLimit
    }
  }

  // 修复现有题目数据的questionType字段
  const fixExistingQuestions = () => {
    console.log('开始修复现有题目数据...')
    
    const updatedQuestions = questions.map(question => {
      // 如果已经有questionType字段，跳过
      if (question.questionType) {
        return question
      }
      
      // 根据category或source字段推断questionType
      let questionType = 'non-scenario' // 默认值
      
      if (question.category === 'scenario' || question.source === 'scenario') {
        questionType = 'scenario'
      } else if (question.category === 'non-scenario' || question.source === 'non-scenario') {
        questionType = 'non-scenario'
      } else if (question.scenarioId || question.scenarioTitle) {
        // 如果有场景相关信息，认为是场景题
        questionType = 'scenario'
      }
      
      return {
        ...question,
        questionType
      }
    })
    
    console.log('修复完成，更新题目数据...')
    setQuestions(updatedQuestions)
    localStorage.setItem('coca_cola_questions', JSON.stringify(updatedQuestions))
    
    // 输出修复结果
    const typeStats = {}
    updatedQuestions.forEach(q => {
      const type = q.questionType || 'undefined'
      typeStats[type] = (typeStats[type] || 0) + 1
    })
    console.log('修复后的questionType分布:', typeStats)
    
    return updatedQuestions.length
  }

  // 新增：获取题目统计信息
  const getQuestionStatistics = () => {
    const stats = {
      total: questions.length,
      byType: {},
      byChannel: {},
      byDifficulty: {},
      byCapability: {},
      scenarios: scenarios.length
    }

    questions.forEach(q => {
      // 按类型统计
      const type = q.questionType || 'undefined'
      stats.byType[type] = (stats.byType[type] || 0) + 1

      // 按渠道统计
      const channel = q.channel || 'undefined'
      stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1

      // 按难度统计
      const difficulty = q.difficulty || 'undefined'
      stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1

      // 按能力统计
      const capability = q.capability || 'undefined'
      stats.byCapability[capability] = (stats.byCapability[capability] || 0) + 1
    })

    return stats
  }

  // 新增：验证测验可行性
  const validateTestFeasibility = (userInfo) => {
    const { channel, position } = userInfo
    const issues = []
    
    // 添加调试信息
    console.log('=== 测验可行性验证开始 ===')
    console.log('用户信息:', userInfo)
    console.log('总题目数:', questions.length)
    console.log('总场景数:', scenarios.length)
    
    // 详细检查场景数据结构
    console.log('场景数据详情:')
    scenarios.forEach((scenario, index) => {
      console.log(`场景 ${index + 1}:`, {
        id: scenario.id,
        title: scenario.title,
        channel: scenario.channel,
        questionsCount: scenario.questions ? scenario.questions.length : 0,
        questionsArray: scenario.questions || [],
        hasQuestions: !!scenario.questions,
        questionsType: typeof scenario.questions,
        isArray: Array.isArray(scenario.questions),
        firstQuestion: scenario.questions && scenario.questions.length > 0 ? {
          id: scenario.questions[0].id,
          questionType: scenario.questions[0].questionType,
          content: scenario.questions[0].content ? scenario.questions[0].content.substring(0, 50) + '...' : 'No content'
        } : null
      })
      
      // 检查每个题目的详细信息
      if (scenario.questions && scenario.questions.length > 0) {
        console.log(`场景 ${scenario.id} 的所有题目:`)
        scenario.questions.forEach((q, qIndex) => {
          console.log(`  题目 ${qIndex + 1}:`, {
            id: q.id,
            questionType: q.questionType,
            hasContent: !!q.content,
            contentLength: q.content ? q.content.length : 0,
            hasOptions: q.options && q.options.length > 0,
            optionsCount: q.options ? q.options.length : 0
          })
        })
      }
    })
    
    // 检查localStorage中的场景数据
    const savedScenarios = localStorage.getItem('coca_cola_scenarios')
    if (savedScenarios) {
      try {
        const parsedScenarios = JSON.parse(savedScenarios)
        console.log('localStorage中的场景数据:')
        console.log('场景数量:', parsedScenarios.length)
        parsedScenarios.forEach((scenario, index) => {
          console.log(`localStorage场景 ${index + 1}:`, {
            id: scenario.id,
            title: scenario.title,
            channel: scenario.channel,
            questionsCount: scenario.questions ? scenario.questions.length : 0,
            hasQuestions: !!scenario.questions
          })
        })
      } catch (error) {
        console.error('解析localStorage场景数据失败:', error)
      }
    } else {
      console.log('localStorage中没有场景数据')
    }
    
    // 检查题目数据结构
    console.log('前5个题目的数据结构:', questions.slice(0, 5).map(q => ({
      id: q.id,
      questionType: q.questionType,
      channel: q.channel,
      difficulty: q.difficulty,
      category: q.category,
      scenarioId: q.scenarioId
    })))
    
    // 检查场景数据
    const channelScenarios = scenarios.filter(s => s.channel === channel)
    console.log(`渠道 ${channel} 的场景数:`, channelScenarios.length)
    
    if (channelScenarios.length === 0) {
      issues.push(`渠道 ${channel} 没有可用的场景`)
    }
    
    // 修复：检查场景题数量 - 使用scenario.questions数组
    const scenarioQuestionCount = channelScenarios.reduce((sum, scenario) => {
      const scenarioQs = scenario.questions || []
      const validScenarioQs = scenarioQs.filter(q => q.questionType === 'scenario')
      console.log(`场景 ${scenario.id} 的题目数:`, validScenarioQs.length)
      return sum + validScenarioQs.length
    }, 0)
    
    console.log('场景题总数:', scenarioQuestionCount)
    
    // 同时检查主题目列表中的场景题
    const scenarioQuestionsInMain = questions.filter(q => q.questionType === 'scenario')
    console.log('主题目列表中的场景题数:', scenarioQuestionsInMain.length)
    
    if (scenarioQuestionCount < 30) {
      issues.push(`场景题不足：需要30题，实际只有${scenarioQuestionCount}题`)
    }
    
    // 检查渠道专属题数量
    const channelQuestions = questions.filter(q => 
      q.channel === channel && q.questionType === 'non-scenario'
    )
    console.log(`渠道 ${channel} 专属题数:`, channelQuestions.length)
    
    if (channelQuestions.length < 10) {
      issues.push(`渠道专属题不足：需要10题，实际只有${channelQuestions.length}题`)
    }
    
    // 检查全渠道题数量
    const omnichannelQuestions = questions.filter(q => 
      q.channel === 'omnichannel' && q.questionType === 'non-scenario'
    )
    console.log('全渠道题数:', omnichannelQuestions.length)
    
    if (omnichannelQuestions.length < 20) {
      issues.push(`全渠道题不足：需要20题，实际只有${omnichannelQuestions.length}题`)
    }
    
    // 检查各种questionType的分布
    const questionTypeStats = {}
    questions.forEach(q => {
      const type = q.questionType || 'undefined'
      questionTypeStats[type] = (questionTypeStats[type] || 0) + 1
    })
    console.log('questionType分布:', questionTypeStats)
    
    // 检查各种channel的分布
    const channelStats = {}
    questions.forEach(q => {
      const ch = q.channel || 'undefined'
      channelStats[ch] = (channelStats[ch] || 0) + 1
    })
    console.log('channel分布:', channelStats)
    
    // 检查职级难度分布
    const distribution = TestGenerationService.DIFFICULTY_DISTRIBUTION[position]
    if (distribution) {
      const difficultyStats = {
        easy: omnichannelQuestions.filter(q => q.difficulty === 'easy').length,
        medium: omnichannelQuestions.filter(q => q.difficulty === 'medium').length,
        hard: omnichannelQuestions.filter(q => q.difficulty === 'hard').length
      }
      
      console.log('难度分布统计:', difficultyStats)
      console.log('职级要求分布:', distribution)
      
      Object.entries(distribution).forEach(([difficulty, required]) => {
        if (difficultyStats[difficulty] < required) {
          issues.push(`${difficulty}难度题目不足：需要${required}题，实际只有${difficultyStats[difficulty]}题`)
        }
      })
    }
    
    console.log('验证问题列表:', issues)
    console.log('=== 测验可行性验证结束 ===')
    
    return {
      feasible: issues.length === 0,
      issues
    }
  }

  const value = {
    questions,
    quizzes,
    results,
    scenarios,
    generateQuiz,
    submitQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    bulkImportQuestions,
    addScenario,
    updateScenario,
    deleteScenario,
    getScenarioForQuestion,
    clearAllData,
    parseWordContent,
    parseMarkdownContent,
    getQuiz: (id) => quizzes.find(q => q.id === id),
    getResult: (id) => results.find(r => r.id === id),
    // 新增的个性化测验功能
    generatePersonalizedTest,
    getTestStatistics,
    validateTestFeasibility,
    fixExistingQuestions, // 添加修复函数
    getQuestionStatistics, // 添加统计函数
    // 常量和工具函数
    CAPABILITIES,
    SUB_CAPABILITIES,
    CHANNELS,
    getQuestionsByChannel,
    getQuestionsByCapability,
    getScenarioQuestions,
    getNonScenarioQuestions,
    getQuestionsByCategory
  }

  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  )
}