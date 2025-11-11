// aiService.js
// 封装：前端直连 Qwen-Plus（阿里云百炼兼容模式）的成长信生成；并内置规则化降级生成
// 注意：演示阶段可在 .env 中配置 VITE_DASHSCOPE_API_KEY，或临时硬编码到下面的 DEFAULT_API_KEY
// 最终外网演示请改为 Cloudflare Workers/本地代理隐藏密钥

import promptText from '../assets/Qwen-Plus生成个性化信函的完整提示词.md?raw'
import fallbackCorpus from '../assets/KO销售能力评测反馈语句库.md?raw'

// 优先读取 .env，其次读取 window 注入的运行时变量，最终回落到默认值
// 在 Vite/ESM 环境下，import.meta.env 一定存在；为了兼容性，这里使用可选链防御
const RUNTIME_ENV = import.meta?.env || {}
// 增加“直接令牌读取”，以配合 vite.config.ts 的 define 静态注入：
// 当 .env 加载异常时，静态替换可保证 import.meta.env.VITE_* 仍能拿到值
const DIRECT_ENV = {
  VITE_DASHSCOPE_API_KEY: import.meta?.env?.VITE_DASHSCOPE_API_KEY,
  VITE_DASHSCOPE_BASE_URL: import.meta?.env?.VITE_DASHSCOPE_BASE_URL,
  VITE_QWEN_MODEL_NAME: import.meta?.env?.VITE_QWEN_MODEL_NAME,
}

const AI_CONFIG = {
  baseURL:
    DIRECT_ENV.VITE_DASHSCOPE_BASE_URL ||
    RUNTIME_ENV?.VITE_DASHSCOPE_BASE_URL ||
    (typeof window !== 'undefined' ? window.DASHSCOPE_BASE_URL : '') ||
    'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model:
    DIRECT_ENV.VITE_QWEN_MODEL_NAME ||
    RUNTIME_ENV?.VITE_QWEN_MODEL_NAME ||
    (typeof window !== 'undefined' ? window.QWEN_MODEL_NAME : '') ||
    'qwen-plus',
}

// 解析 API Key：优先 .env，其次 window/localStorage/sessionStorage 注入
function resolveApiKey() {
  try {
    let key = DIRECT_ENV.VITE_DASHSCOPE_API_KEY || RUNTIME_ENV?.VITE_DASHSCOPE_API_KEY
    if (!key && typeof window !== 'undefined') {
      key = window.DASHSCOPE_API_KEY ||
            (window.localStorage ? localStorage.getItem('DASHSCOPE_API_KEY') : null) ||
            (window.sessionStorage ? sessionStorage.getItem('DASHSCOPE_API_KEY') : null)
    }
    return key || 'sk-78030ef41b6d4c6ab3a8d4640b6c07ec'
  } catch (e) {
    return 'sk-78030ef41b6d4c6ab3a8d4640b6c07ec'
  }
}

// 警告：仅用于本地/内网快速演示。请用 .env 注入或者在运行时通过 window/localStorage 设置
const DEFAULT_API_KEY = resolveApiKey()

// 构造 Chat Completions 消息
function buildMessages(payload) {
  const system = '你是一位温暖、专业的成长教练。请以中文输出，语气积极、鼓励，避免品牌化色彩。'

  const user = `请根据以下测评数据和写作要求，生成一封《未来的我致今天的我的成长信》。\n\n` +
    `【写作提示】\n` +
    `${promptText}\n\n` +
    `【测评数据（JSON）】\n` +
    `${JSON.stringify(payload, null, 2)}\n\n` +
    `【要求】\n` +
    `- 按提示词中的四段结构输出（情感连接→共鸣困扰→行动建议→鼓励与期盼收尾）；\n` +
    `- 总字数约600~1000字；语言风格暖、鼓励，避免营销话术；\n` +
    `- strengths 与 improvements 使用 payload 中的名称，不要改名；\n` +
    `- 末尾以“来自未来的{姓名}”落款。`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

// 解析语料库Markdown表格，抽取三列：情感连接语句 / 困扰共鸣语句 / 微行动建议
function parseCorpusTable(raw) {
  const map = {}
  const lines = raw.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue
    const cells = trimmed.split('|').map(s => s.trim())
    // 形如: ['', '能力项', '情感连接语句', '困扰共鸣语句', '微行动建议', '']
    if (cells.length < 6) continue
    const ability = cells[1]
    if (!ability || ability === '能力项') continue
    const connect = cells[2] || ''
    const empathy = cells[3] || ''
    const action = cells[4] || ''
    map[ability] = { connect, empathy, action }
  }
  return map
}

// 去除前缀编号，例如 "2.2.1 收益管理" => "收益管理"
function normalizeName(name) {
  return (name || '').replace(/^\s*\d+(?:\.\d+)*\s*/, '').trim()
}

// 规则化降级生成：从语料库中抽取片段并拼装四段结构（满足a~g项修正要求）
function fallbackGenerate(payload) {
  const name = payload?.name || '同学'
  const strengthsRaw = Array.isArray(payload?.strengths) ? payload.strengths.slice(0, 3) : []
  const improvementsRaw = Array.isArray(payload?.improvements) ? payload.improvements.slice(0, 2) : []

  const strengths = strengthsRaw.map(normalizeName).filter(Boolean)
  const improvements = improvementsRaw.map(normalizeName).filter(Boolean)

  const corpus = parseCorpusTable(fallbackCorpus)

  // 第一段：保留优势列表（去编号），并从其中任选一项提取“情感连接语句”用于夸奖
  const chosenStrength = strengths[0]
  const connectLine = chosenStrength && corpus[chosenStrength] ? corpus[chosenStrength].connect : ''

  const part1 = `亲爱的${name}：\n\n在这段日常打磨与实战中，你已经在${strengths.join('、')}等方面展现了扎实的能力与稳定的表现。` +
    (connectLine ? `我尤其注意到：${connectLine}` : '') +
    `\n这些优势为你在复杂情境下的判断与沟通打下了坚实基础。`

  // 第二段：针对两项待提升能力，分别抽取“困扰共鸣语句”形成两句话
  const empathy1 = improvements[0] && corpus[improvements[0]] ? corpus[improvements[0]].empathy : ''
  const empathy2 = improvements[1] && corpus[improvements[1]] ? corpus[improvements[1]].empathy : ''

  const empathyText = [empathy1, empathy2].filter(Boolean).join(' ') // 以空格拼接两句

  const part2 = `我们也一起看到了需要持续精进的方向：${improvements.join('、')}。` +
    (empathyText ? `当遇到这些情境时，你可能会有这样的感受：${empathyText}` : '') +
    `\n请相信，这些阶段性的困扰并不代表能力缺失，而是下一次跃迁前的必经之路。`

  // 第三段：针对两项待提升能力，抽取各自的“微行动建议”形成两条建议
  const action1 = improvements[0] && corpus[improvements[0]] ? corpus[improvements[0]].action : ''
  const action2 = improvements[1] && corpus[improvements[1]] ? corpus[improvements[1]].action : ''
  const actions = [action1, action2].filter(Boolean)

  const defaultActions = [
    '每日复盘一个真实客户场景，记录“判断依据”和“备选方案”。',
    '针对薄弱子能力设定一周训练清单，完成后复盘改进点。'
  ]

  const part3Lines = actions.length >= 2 ? actions : (actions.length === 1 ? [actions[0], defaultActions[1]] : defaultActions)
  const part3 = `为了更稳地向前，我为你准备了两步可执行的微行动：\n1. ${part3Lines[0]}\n2. ${part3Lines[1]}\n坚持以小步快跑的方式完成这些练习，你的能力会在不知不觉中快速累积。`

  // 第四段：鼓励收尾（去编号），不再附加模型名称
  const part4 = `我真心为你在${chosenStrength || '关键能力'}上的稳定发挥感到骄傲。继续把这些优势延伸到${improvements[0] || '待提升能力'}上，你会看到更广阔的可能性。\n\n来自未来的${name}`

  return [part1, '', part2, '', part3, '', part4].join('\n')
}

// 直接调用 DashScope 兼容模式 Chat Completions
async function callQwenPlus(payload, apiKey = DEFAULT_API_KEY) {
  if (!apiKey || apiKey === 'YOUR_DASHSCOPE_API_KEY_HERE') {
    throw new Error('Missing DASHSCOPE API Key')
  }

  const url = `${AI_CONFIG.baseURL}/chat/completions`
  const messages = buildMessages(payload)

  const body = {
    model: AI_CONFIG.model,
    messages,
    temperature: 0.7,
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`QwenPlus API error: ${resp.status} ${text}`)
  }
  const data = await resp.json()
  const content = data?.choices?.[0]?.message?.content || ''
  const usage = data?.usage || undefined
  return { letter: content, usage }
}

/**
 * 生成成长信（优先调用 LLM，失败则降级）
 * @param {object} payload GrowthLetterPayload
 * @param {object} options { apiKey?: string, forceFallback?: boolean }
 * @returns {Promise<{ letter: string, model: string, usage?: any }>} 
 */
export async function generateGrowthLetter(payload, options = {}) {
  const apiKey = options.apiKey || DEFAULT_API_KEY
  const forceFallback = options.forceFallback === true

  if (!forceFallback) {
    try {
      const { letter, usage } = await callQwenPlus(payload, apiKey)
      return { letter, model: AI_CONFIG.model, usage }
    } catch (err) {
      console.warn('LLM调用失败，自动降级：', err?.message || err)
    }
  }

  const letter = fallbackGenerate(payload)
  return { letter, model: 'fallback-rule' }
}

export const aiConfig = {
  ...AI_CONFIG,
  // 提供给调用方用于快速演示设置密钥
  get apiKey() { return DEFAULT_API_KEY },
}