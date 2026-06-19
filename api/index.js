const https = require('https');

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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_KEY || API_KEY === 'your_deepseek_api_key_here') {
    return res.status(400).json({ error: 'Please configure DeepSeek API Key in .env file' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
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

  return new Promise((resolve, reject) => {
    const apiReq = https.request(options, function(apiRes) {
      let data = '';
      apiRes.on('data', function(chunk) { data += chunk; });
      apiRes.on('end', function() {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            res.status(400).json({ error: parsed.error.message || 'API request failed' });
            resolve();
          } else {
            res.status(200).json(JSON.parse(parsed.choices[0].message.content));
            resolve();
          }
        } catch(e) {
          res.status(500).json({ error: 'Failed to parse API response' });
          resolve();
        }
      });
    });

    apiReq.on('error', function(err) {
      res.status(500).json({ error: err.message });
      resolve();
    });

    apiReq.write(postData);
    apiReq.end();
  });
};
