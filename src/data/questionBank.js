// 可口可乐销售能力评估题库
// 基于完整题库0803导入
import { QUESTION_BANK as GENERATED_QUESTION_BANK, SCENARIOS as GENERATED_SCENARIOS } from './generatedQuestionBank.js';

// 数据版本：用于触发本地缓存刷新
export const DATA_VERSION = '2025-11-11-optimized-omni-70-50';

// 能力分类映射
export const CAPABILITIES = {
  '1': '1.全域洞察力',
  '2': '2.方案规划力', 
  '3': '3.故事沟通力',
  '4': '4.卖进谈判力',
  '5': '5.客户发展力',
  '6': '6.卓越执行力',
  '7': '7.战略领导力'
};

// 子能力项映射
export const SUB_CAPABILITIES = {
  '1.1': '1.1 从数据到洞察',
  '1.2': '1.2 品类分析应用',
  '2.1': '2.1 渠道解决方案',
  '2.2': '2.2 职能解决方案',
  // 细分：职能解决方案（2.2.x）- 与完整题库保持一致
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
};

// 渠道类型
export const CHANNELS = {
  'omnichannel': '全渠道',
  'hypermarket': '大卖场/超市',
  'cvs': 'CVS',
  'ecommerce': '电商',
  'ed': 'E&D',
  'special': '特殊渠道'
};

// 场景数据（原始内置，保留但不再使用）
export const SCENARIOS_ORIGINAL = [
  {
    id: 'scenario_cvs_1',
    title: '便利店健康饮品升级方案',
    channel: 'cvs',
    description: `你是可口可乐公司负责华东区域便利店渠道的KAM，主要负责与连锁便利店客户C的合作。最近三个月的销售数据显示：可口可乐在该客户系统的销量增长了15%，但你发现一个异常情况：无糖可乐的销量增长了45%，而经典可口可乐的销量下降了8%。同期，该便利店系统的整体饮料品类销量增长了12%，其中友商A品牌增长了25%，友商B品牌增长了18%。

通过进一步数据分析，你发现该便利店系统主要分布在办公楼密集区域，其中60%的门店位于商务区，25%位于居民区，15%位于学校周边。客户反馈，近期有不少消费者询问是否有更多健康、低糖的饮料选择。同时，客户也提到友商A最近在该系统投放了大量促销资源，并且推出了新的健康饮品系列。

面对这种复杂的竞争局面，你需要基于数据洞察制定相应的应对策略。`,
    questionIds: ['cvs_scenario_1_q1', 'cvs_scenario_1_q2', 'cvs_scenario_1_q3', 'cvs_scenario_1_q4', 'cvs_scenario_1_q5']
  }
];
// 使用生成版场景数据
export const SCENARIOS = GENERATED_SCENARIOS;

// 题库数据（原始内置，保留但不再使用）
export const QUESTION_BANK_ORIGINAL = [
  // CVS场景题 - 场景1
  {
    id: 'cvs_scenario_1_q1',
    content: '根据以上数据，可以得出的合理结论是：',
    options: [
      '可口可乐品牌在该客户系统表现优于竞争对手',
      '消费者对健康、低糖饮品的需求趋势明显上升',
      '经典可口可乐产品已经失去市场竞争力',
      '该便利店系统的选址策略存在问题'
    ],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: '无糖可乐45%的高增长，结合消费者询问健康低糖选择的反馈，明确显示了消费者需求趋势',
    category: 'professional',
    channel: 'cvs',
    questionType: 'scenario',
    scenarioId: 'scenario_cvs_1',
    subCapability: '1.1',
    tags: ['CVS', '易', '1.1 从数据到洞察']
  },
  {
    id: 'cvs_scenario_1_q2',
    content: '基于购物者行为分析框架（Who、Why、What、How），以下哪个分析最能解释无糖可乐销量激增的原因？',
    options: [
      'Who：该区域白领人群占比高，注重健康管理',
      'Why：无糖可乐价格比经典可乐更便宜',
      'What：消费者同时购买了更多零食品类',
      'How：无糖可乐的包装设计更吸引人'
    ],
    correctAnswer: 0,
    difficulty: 'medium',
    explanation: '结合场景中60%门店位于商务区，白领群体确实更注重健康，符合Who维度的深度分析',
    category: 'professional',
    channel: 'cvs',
    questionType: 'scenario',
    scenarioId: 'scenario_cvs_1',
    subCapability: '1.1',
    tags: ['CVS', '中', '1.1 从数据到洞察']
  },
  {
    id: 'cvs_scenario_1_q3',
    content: '面对友商A大量促销资源投放的竞争压力，你应该优先采取哪种策略？',
    options: [
      '立即申请更多促销费用，直接对抗友商A的促销',
      '降低可口可乐产品供价，通过价格优势抢夺市场',
      '深入了解友商A的具体促销内容和客户反应，制定针对性应对方案',
      '要求客户停止与友商A的合作，独家销售可口可乐产品'
    ],
    correctAnswer: 2,
    difficulty: 'easy',
    explanation: '符合问题解决技巧中的"情报收集"原则，了解竞争对手动态是制定有效策略的前提',
    category: 'professional',
    channel: 'cvs',
    questionType: 'scenario',
    scenarioId: 'scenario_cvs_1',
    subCapability: '4.1',
    tags: ['CVS', '易', '4.1 问题解决技巧']
  },
  {
    id: 'cvs_scenario_1_q4',
    content: '基于数据分析结果，你计划向客户提出增加无糖产品货架空间的建议。为了提高谈判成功率，你需要准备哪些关键信息？',
    options: [
      '无糖可乐的生产成本和利润空间数据',
      '无糖可乐45%增长率与品类整体12%增长率的对比分析',
      '友商无糖产品在其他便利店系统的销售表现',
      '可口可乐品牌的历史合作成果和市场地位'
    ],
    correctAnswer: 1,
    difficulty: 'medium',
    explanation: '基于公平货架原则和数据驱动的优化建议，45% vs 12%的增长差异是最有说服力的证据',
    category: 'professional',
    channel: 'cvs',
    questionType: 'scenario',
    scenarioId: 'scenario_cvs_1',
    subCapability: '4.1',
    tags: ['CVS', '中', '4.1 问题解决技巧']
  },
  {
    id: 'cvs_scenario_1_q5',
    content: '综合考虑所有数据和竞争情况，以下哪个策略组合最能实现可口可乐在该客户系统的长期增长？',
    options: [
      '专注推广无糖系列产品，逐步淘汰经典可乐在该系统的投入',
      '增加无糖产品推广力度，同时针对不同门店位置制定差异化产品组合策略',
      '与客户签署独家合作协议，排除友商竞争',
      '降低整体产品价格，通过价格优势重新获得市场份额'
    ],
    correctAnswer: 1,
    difficulty: 'medium',
    explanation: '既抓住了无糖产品的增长机会，又考虑了不同位置门店的差异化需求（商务区vs居民区vs学校），体现了基于洞察的系统性解决方案',
    category: 'professional',
    channel: 'cvs',
    questionType: 'scenario',
    scenarioId: 'scenario_cvs_1',
    subCapability: '4.1',
    tags: ['CVS', '中', '4.1 问题解决技巧']
  },

  // 非场景题示例 - CVS渠道
  {
    id: 'cvs_non_scenario_1',
    content: '在便利店渠道中，可口可乐产品的最佳陈列位置是：',
    options: [
      '货架最上层',
      '货架中间层（黄金视线位置）',
      '货架最下层',
      '门店入口处'
    ],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: '货架中间层是消费者视线最容易接触的黄金位置，有利于提高产品的可见性和购买率',
    category: 'professional',
    channel: 'cvs',
    questionType: 'non-scenario',
    subCapability: '6.2',
    tags: ['CVS', '易', '6.2 卓越完美执行']
  },

  // 全渠道题目示例（通用题目）
  {
    id: 'omni_general_1',
    content: '在销售过程中，建立客户信任的最有效方法是什么？',
    options: [
      '价格优惠',
      '专业知识展示',
      '真诚沟通',
      '产品演示'
    ],
    correctAnswer: 2,
    difficulty: 'easy',
    explanation: '真诚沟通是建立客户信任的基础，通过诚实、透明的交流建立长期关系',
    category: 'general',
    channel: 'omnichannel',
    questionType: 'non-scenario',
    subCapability: '3.1',
    tags: ['全渠道', '易', '3.1 高效沟通技巧']
  },
  {
    id: 'omni_general_2',
    content: '处理客户异议时，最佳的第一步是什么？',
    options: [
      '立即反驳',
      '认真倾听',
      '提供折扣',
      '转移话题'
    ],
    correctAnswer: 1,
    difficulty: 'medium',
    explanation: '认真倾听客户的异议，理解其真正的担忧，是有效处理异议的第一步',
    category: 'general',
    channel: 'omnichannel',
    questionType: 'non-scenario',
    subCapability: '4.3',
    tags: ['全渠道', '中', '4.3 解决谈判阻力']
  }
];
// 使用生成版题库数据
export const QUESTION_BANK = GENERATED_QUESTION_BANK;

// 获取指定渠道的题目
export const getQuestionsByChannel = (channel) => {
  return QUESTION_BANK.filter(q => q.channel === channel);
};

// 获取指定能力的题目
export const getQuestionsByCapability = (capability) => {
  const capabilityCode = Object.keys(CAPABILITIES).find(key => CAPABILITIES[key] === capability);
  if (!capabilityCode) return [];
  
  return QUESTION_BANK.filter(q => q.subCapability && q.subCapability.startsWith(capabilityCode));
};

// 获取场景题目
export const getScenarioQuestions = (scenarioId) => {
  return QUESTION_BANK.filter(q => q.scenarioId === scenarioId);
};

// 获取非场景题目
export const getNonScenarioQuestions = () => {
  return QUESTION_BANK.filter(q => q.questionType === 'non-scenario');
};

// 根据类别获取题目（专业/通用）
export const getQuestionsByCategory = (category) => {
  return QUESTION_BANK.filter(q => q.category === category);
};