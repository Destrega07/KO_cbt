// 完整题库导入脚本
import { parseQuestionBankFile, validateQuestions, generateImportReport } from '../utils/questionBankImporter.js';

// 读取题库文件
async function readQuestionBankFile() {
  try {
    const response = await fetch('/src/assets/QuestionBank.txt');
    if (!response.ok) {
      throw new Error('无法读取题库文件');
    }
    return await response.text();
  } catch (error) {
    console.error('读取题库文件失败:', error);
    throw error;
  }
}

// 导入完整题库
export async function importFullQuestionBank() {
  try {
    console.log('开始导入完整题库...');
    
    // 读取题库文件
    const fileContent = await readQuestionBankFile();
    console.log('题库文件读取成功，文件大小:', fileContent.length, '字符');
    
    // 解析题库内容
    const { questions, scenarios } = parseQuestionBankFile(fileContent);
    console.log(`解析完成: ${questions.length} 道题目, ${scenarios.length} 个场景`);
    
    // 验证题目
    const validation = validateQuestions(questions);
    console.log(`验证完成: ${validation.valid.length} 道有效题目, ${validation.invalid.length} 道无效题目`);
    
    if (validation.invalid.length > 0) {
      console.warn('发现无效题目:', validation.errors.slice(0, 5)); // 只显示前5个错误
    }
    
    // 生成导入报告
    const report = generateImportReport(validation.valid, scenarios);
    console.log('导入报告:', report);
    
    // 更新localStorage
    localStorage.setItem('coca_cola_questions', JSON.stringify(validation.valid));
    localStorage.setItem('coca_cola_scenarios', JSON.stringify(scenarios));
    
    console.log('题库导入成功! 即将刷新页面...');
    
    // 延迟刷新页面以确保数据保存
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    return {
      success: true,
      questions: validation.valid,
      scenarios,
      report
    };
    
  } catch (error) {
    console.error('题库导入失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 快速导入函数（用于测试）
export function quickImport() {
  importFullQuestionBank().then(result => {
    if (result.success) {
      alert(`导入成功！\n题目数量: ${result.questions.length}\n场景数量: ${result.scenarios.length}`);
    } else {
      alert(`导入失败: ${result.error}`);
    }
  });
}

// 如果直接运行此脚本
if (typeof window !== 'undefined') {
  window.importFullQuestionBank = importFullQuestionBank;
  window.quickImport = quickImport;
  console.log('题库导入脚本已加载。可以在控制台运行 quickImport() 来快速导入题库。');
}