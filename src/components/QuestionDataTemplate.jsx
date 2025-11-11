import React from 'react'
import { Download, FileText, AlertCircle } from 'lucide-react'

const QuestionDataTemplate = () => {
  const generateTemplate = () => {
    const template = `# 可口可乐题库导入模板

## 使用说明
1. 每道题目以数字开头，如：1. 题目内容
2. 选项使用 A. B. C. D. 格式
3. 答案格式：答案：A
4. 解析格式：解析：解释内容
5. 难度格式：难度：简单/中等/困难
6. 类别格式：类别：专业/通用

## 示例题目

1. 可口可乐公司成立于哪一年？
A. 1885年
B. 1886年
C. 1887年
D. 1888年
答案：B
解析：可口可乐公司成立于1886年，由约翰·彭伯顿博士在美国亚特兰大创立。
难度：简单
类别：专业
考察能力：1.全域洞察力
子能力项：1.1 从数据到洞察

2. 在销售过程中，建立客户信任的最有效方法是什么？
A. 价格优惠
B. 专业知识展示
C. 真诚沟通
D. 产品演示
答案：C
解析：真诚沟通是建立客户信任的基础，通过诚实、透明的交流建立长期关系。
难度：中等
类别：通用
考察能力：3.故事沟通力
子能力项：3.2 客户沟通技巧

3. 可口可乐的品牌核心价值观不包括以下哪项？
A. 快乐
B. 真实
C. 奢华
D. 活力
答案：C
解析：可口可乐的品牌核心价值观包括快乐、真实、活力等，但不包括奢华，因为品牌定位是大众化的快乐饮品。
难度：困难
类别：专业
考察能力：1.全局洞察力
子能力项：1.2 市场趋势分析

## 批量导入步骤
1. 复制上述格式的题目内容
2. 在题库管理页面点击"批量导入"
3. 选择"Markdown格式"
4. 粘贴内容并点击"开始导入"

## 注意事项
- 确保每道题目格式完整
- 答案选项必须是 A、B、C、D 中的一个
- 类别只能是"专业"或"通用"
- 难度只能是"简单"、"中等"或"困难"
- 考察能力必须是7个选项之一
- 子能力项需要与考察能力对应
`

    const blob = new Blob([template], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '可口可乐题库导入模板.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-4">
        <FileText className="text-coca-red" size={24} />
        <h3 className="text-lg font-bold text-gray-800">题库导入指南</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-blue-800 mb-2">如何导入您的题库</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p><strong>方法一：</strong>将Word文档内容转换为Markdown格式后导入</p>
                <p><strong>方法二：</strong>使用我们提供的模板格式整理题目</p>
                <p><strong>方法三：</strong>逐个手动添加题目（适合少量题目）</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Word文档转换步骤</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>1. 打开您的Word文档（可口可乐题库_CVS.docx）</p>
            <p>2. 复制题目内容到文本编辑器</p>
            <p>3. 按照模板格式整理（题目、选项、答案、解析等）</p>
            <p>4. 使用批量导入功能导入整理后的内容</p>
          </div>
        </div>

        <button
          onClick={generateTemplate}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          <Download size={20} />
          <span>下载导入模板</span>
        </button>
      </div>
    </div>
  )
}

export default QuestionDataTemplate