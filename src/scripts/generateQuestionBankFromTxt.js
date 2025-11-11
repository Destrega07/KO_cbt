// 生成脚本：读取 Markdown/文本题库并写出 src/data/generatedQuestionBank.js（ESM）
// 用法：node src/scripts/generateQuestionBankFromTxt.js [inputPath] [outputPath]
// 默认输入：src/assets/QuestionBank_Optimized.txt；默认输出：src/data/generatedQuestionBank.js

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseQuestionBankFromText } from '../utils/questionBankParser.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  try {
    const args = process.argv.slice(2)
    const cwd = process.cwd()
    const defaultInput = path.join(cwd, 'src', 'assets', 'QuestionBank_Optimized.txt')
    const defaultOutput = path.join(cwd, 'src', 'data', 'generatedQuestionBank.js')

    const inputPath = args[0] ? args[0] : defaultInput
    const outputPath = args[1] ? args[1] : defaultOutput

    console.log(`[generate] 输入文件: ${inputPath}`)
    console.log(`[generate] 输出文件: ${outputPath}`)

    const raw = await fs.readFile(inputPath, 'utf-8')
    const { SCENARIOS, QUESTION_BANK } = parseQuestionBankFromText(raw)

    // 基本校验与统计
    const scenarioCount = Array.isArray(SCENARIOS) ? SCENARIOS.length : 0
    const questionCount = Array.isArray(QUESTION_BANK) ? QUESTION_BANK.length : 0
    console.log(`[generate] 解析完成：场景 ${scenarioCount} 个，题目 ${questionCount} 道`)

    // 输出 ESM 文件
    const banner = `// 此文件为自动生成，请勿手工编辑\n// Source: ${inputPath}\n// Generated: ${new Date().toISOString()}\n\n`
    const content = `${banner}export const SCENARIOS = ${JSON.stringify(SCENARIOS, null, 2)}\n\nexport const QUESTION_BANK = ${JSON.stringify(QUESTION_BANK, null, 2)}\n`
    await fs.writeFile(outputPath, content, 'utf-8')
    console.log('[generate] 写入完成')
  } catch (err) {
    console.error('[generate] 生成失败:', err?.message || err)
    process.exitCode = 1
  }
}

main()