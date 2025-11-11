// Quick analyzer for generatedQuestionBank.js distribution
const fs = require('fs')
const path = require('path')

const filePath = path.resolve(__dirname, '..', 'src', 'data', 'generatedQuestionBank.js')
const text = fs.readFileSync(filePath, 'utf8')

const countMatches = (regex) => (text.match(regex) || []).length

const scenarioCount = countMatches(/"questionType": "scenario"/g)
const nonScenarioCount = countMatches(/"questionType": "non-scenario"/g)
const omniChannelCount = countMatches(/"channel": "omnichannel"/g)

const totalQuestions = countMatches(/"question":/g)

console.log(JSON.stringify({
  totalQuestions,
  scenarioCount,
  nonScenarioCount,
  omniChannelCount,
  channelSpecificCount: nonScenarioCount - omniChannelCount
}, null, 2))