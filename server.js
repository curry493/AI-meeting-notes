const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 确保 data 目录存在
const DATA_DIR = process.env.VERCEL 
  ? '/tmp/data'  // Vercel serverless 用 /tmp
  : path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// 历史记录 API
function readHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('读取历史记录失败:', e);
  }
  return [];
}

function writeHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('保存历史记录失败:', e);
    return false;
  }
}

// 获取所有历史记录
app.get('/api/history', function(req, res) {
  const history = readHistory();
  res.json(history);
});

// 保存新记录
app.post('/api/history', function(req, res) {
  const { input, output, topic } = req.body;
  if (!input) {
    return res.status(400).json({ error: '缺少输入内容' });
  }
  
  const history = readHistory();
  const newRecord = {
    id: Date.now().toString(),
    input: input,
    output: output || null,
    topic: topic || '未命名',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // 新记录添加到开头
  history.unshift(newRecord);
  
  // 只保留最近 100 条记录
  if (history.length > 100) {
    history.splice(100);
  }
  
  if (writeHistory(history)) {
    res.json({ success: true, record: newRecord });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 更新记录（修改输出结果）
app.put('/api/history/:id', function(req, res) {
  const { id } = req.params;
  const { input, output, topic } = req.body;
  
  const history = readHistory();
  const index = history.findIndex(r => r.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: '记录不存在' });
  }
  
  if (input !== undefined) history[index].input = input;
  if (output !== undefined) history[index].output = output;
  if (topic !== undefined) history[index].topic = topic;
  history[index].updatedAt = new Date().toISOString();
  
  if (writeHistory(history)) {
    res.json({ success: true, record: history[index] });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 删除记录
app.delete('/api/history/:id', function(req, res) {
  const { id } = req.params;
  let history = readHistory();
  history = history.filter(r => r.id !== id);
  
  if (writeHistory(history)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: '删除失败' });
  }
});

const API_KEY = process.env.DEEPSEEK_API_KEY;

const lines = [
  '你是一位专业的会议纪要助手。',
  '',
  '请根据会议内容生成 JSON 格式纪要，包含：',
  '- topic: 主题',
  '- summary: 摘要（只写确定的事实）',
  '- decisions: 明确达成的共识',
  '- pendingDecisions: 未决事项（有争议、待确认、被搁置的方案）',
  '- actionItems: 待办（必须有明确责任人+具体任务+明确时间）',
  '- emailDraft: 邮件草稿',
  '',
  '核心规则：',
  '1. decisions: 必须有"确定"、"同意"、"决定"等信号词',
  '2. pendingDecisions:',
  '   - "先按XX"、"暂时XX"——临时方案',
  '   - "但是有个问题"——有争议的方案',
  '   - "我来确认一下"——待确认的方案',
  '3. actionItems: 必须有明确时间（今天、明天、下周三等），不能写"待定"',
  '4. 只基于原文，不推断、不编造',
  '',
  '示例：',
  '原文："先按上架时间倒序排吧，这个我来跟运营确认一下"',
  '→ pendingDecisions: "搜索排序逻辑：销量+评分方案被搁置，待运营确认后确定"',
  '',
  '原文："今天下班前搞定"',
  '→ actionItems: {task: "修改搜索排序逻辑", owner: "王五", deadline: "今天", priority: "高"}'
];

const SYSTEM_PROMPT = lines.join('\n');

app.post('/api/summarize', function(req, res) {
  const text = req.body.text;
  
  if (!API_KEY || API_KEY === 'your_api_key_here') {
    return res.status(400).json({ error: 'Please configure DeepSeek API Key in .env file' });
  }
  
  const postData = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text }
    ],
    response_format: { type: 'json_object' }
  });

  const options = {
    hostname: 'api.deepseek.com',
    path: '/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const apiReq = https.request(options, function(apiRes) {
    let data = '';
    apiRes.on('data', function(chunk) { data += chunk; });
    apiRes.on('end', function() {
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          return res.status(400).json({ error: parsed.error.message || 'API request failed' });
        }
        res.json(JSON.parse(parsed.choices[0].message.content));
      } catch(e) {
        res.status(500).json({ error: 'Failed to parse API response' });
      }
    });
  });

  apiReq.on('error', function(err) {
    res.status(500).json({ error: err.message });
  });

  apiReq.write(postData);
  apiReq.end();
});

app.listen(PORT, function() {
  console.log('SUCCESS: Server started at http://localhost:' + PORT);
});

// Vercel serverless 模式
module.exports = app;
