import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const Review = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResult = () => {
      try {
        // 修复：使用正确的localStorage键名
        const savedResults = JSON.parse(localStorage.getItem('coca_cola_results') || '[]');
        const foundResult = savedResults.find(r => r.id === resultId);
        
        if (foundResult) {
          setResult(foundResult);
        } else {
          console.error('Result not found');
          console.log('Available results:', savedResults.map(r => r.id));
          console.log('Looking for resultId:', resultId);
        }
      } catch (error) {
        console.error('Error loading result:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载解析中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">未找到测试结果</h2>
          <p className="text-gray-600 mb-4">无法加载解析数据</p>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  // 场景信息
  const scenarios = result.scenarios || [];

  const getScenarioForQuestion = (questionIndex) => {
    return scenarios.find(scenario => 
      questionIndex >= scenario.questionRange[0] && 
      questionIndex <= scenario.questionRange[1]
    );
  };

  const shouldShowScenario = (questionIndex) => {
    const scenario = getScenarioForQuestion(questionIndex);
    return scenario && questionIndex === scenario.questionRange[0];
  };

  // 只显示前30道场景题（有解析的题目）
  // 修复：使用正确的数据结构
  const scenarioAnswers = (result.questionResults || result.answers || []).slice(0, 30);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">场景题详细解析</h1>
            <Link 
              to={`/results/${resultId}`} 
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回测试结果
            </Link>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-blue-800 text-sm">
              📝 本页面仅展示前30道场景题的详细解析。非场景题没有答案解析。
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.score}%</div>
              <div className="text-sm text-gray-600">总分</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
              <div className="text-sm text-gray-600">正确题数</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{result.totalQuestions - result.correctAnswers}</div>
              <div className="text-sm text-gray-600">错误题数</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">30</div>
              <div className="text-sm text-gray-600">场景题数</div>
            </div>
          </div>
        </div>

        {/* Questions Review - 只显示场景题 */}
        <div className="space-y-6">
          {scenarioAnswers.map((answer, index) => {
            const questionNumber = index + 1;
            const scenario = getScenarioForQuestion(questionNumber);
            const shouldDisplayScenario = shouldShowScenario(questionNumber);
            
            return (
              <div key={index}>
                {/* Scenario Display */}
                {shouldDisplayScenario && scenario && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6 rounded-r-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">{scenario.title}</h3>
                    <div className="text-blue-700 whitespace-pre-line leading-relaxed">
                      {scenario.content}
                    </div>
                  </div>
                )}

                {/* Question Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {answer.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {/* Question Header */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                          第 {questionNumber} 题
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          场景题
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          answer.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          answer.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {answer.difficulty === 'easy' ? '简单' : 
                           answer.difficulty === 'medium' ? '中等' : '困难'}
                        </span>
                        {(answer.capability || answer.question?.capability) && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {answer.capability || answer.question?.capability}
                          </span>
                        )}
                      </div>

                      {/* Question Content */}
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {answer.question || answer.content}
                      </h3>

                      {/* Options */}
                      <div className="space-y-2 mb-4">
                        {answer.options && answer.options.map((option, optionIndex) => {
                          const optionLetter = String.fromCharCode(65 + optionIndex);
                          // 根据题库数据（索引型答案）判断选中与正确
                          const ua = answer.userAnswer;
                          const ca = answer.correctAnswer;
                          const isUserAnswer = Array.isArray(ua) 
                            ? (ua.includes(optionIndex) || ua.includes(optionLetter))
                            : (ua === optionIndex || ua === optionLetter);
                          const isCorrectAnswer = Array.isArray(ca)
                            ? (ca.includes(optionIndex) || ca.includes(optionLetter))
                            : (ca === optionIndex || ca === optionLetter);
                          
                          let optionClass = 'p-3 rounded-lg border ';
                          if (isCorrectAnswer) {
                            optionClass += 'bg-green-50 border-green-200 text-green-800';
                          } else if (isUserAnswer && !isCorrectAnswer) {
                            optionClass += 'bg-red-50 border-red-200 text-red-800';
                          } else {
                            optionClass += 'bg-gray-50 border-gray-200 text-gray-700';
                          }
                          
                          return (
                            <div key={optionIndex} className={optionClass}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{optionLetter}.</span>
                                <span>{option}</span>
                                {isCorrectAnswer && (
                                  <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Answer Summary */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">你的答案：</span>
                            <span className={answer.isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {(() => {
                                const indexToLetter = (n) => {
                                  if (typeof n === 'number') return String.fromCharCode(65 + n);
                                  if (typeof n === 'string') return n; // 兼容旧数据已是字母
                                  return '';
                                };
                                const ua = answer.userAnswer;
                                if (Array.isArray(ua)) {
                                  return ua.length ? ua.map(indexToLetter).join(', ') : '未作答';
                                }
                                return ua != null ? indexToLetter(ua) : '未作答';
                              })()}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">正确答案：</span>
                            <span className="text-green-600">
                              {(() => {
                                const indexToLetter = (n) => {
                                  if (typeof n === 'number') return String.fromCharCode(65 + n);
                                  if (typeof n === 'string') return n;
                                  return '';
                                };
                                const ca = answer.correctAnswer;
                                if (Array.isArray(ca)) {
                                  return ca.map(indexToLetter).join(', ');
                                }
                                return indexToLetter(ca);
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Explanation - 只有场景题才显示解析 */}
                      {answer.explanation && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">选项解析：</h4>
                          <p className="text-blue-700 leading-relaxed">
                            {answer.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link 
            to={`/results/${resultId}`} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回测试结果
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Review;