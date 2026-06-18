# AI Meeting Notes - AI 会议纪要生成器

将会议录音转写文字粘贴进来，AI 自动生成结构化会议纪要。

## 功能

- **主题识别**：自动提取会议主题
- **摘要生成**：只记录确定的事实，不编造内容
- **关键决策**：识别"同意"、"决定"等信号词
- **待决事项**：记录被搁置、有争议或待确认的方案
- **待办事项**：提取责任人、任务和截止时间
- **邮件草稿**：自动生成会议纪要邮件

## 技术栈

- **前端**：原生 HTML + JavaScript + Tailwind CSS
- **后端**：Node.js + Express
- **AI**：DeepSeek API

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

复制 `.env.example` 为 `.env`，填入你的 DeepSeek API Key：

```env
DEEPSEEK_API_KEY=your_api_key_here
PORT=3000
```

### 3. 启动服务

```bash
npm start
```

访问 http://localhost:3000 即可使用。

## 部署

### Vercel

1. 安装 Vercel CLI：`npm i -g vercel`
2. 运行 `vercel` 按提示完成部署
3. 在 Vercel 项目设置中添加环境变量 `DEEPSEEK_API_KEY`

### 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 是 |
| `PORT` | 服务端口（默认 3000） | 否 |

## 项目结构

```
├── server.js          # Express 后端服务
├── package.json       # 项目配置
├── .env.example       # 环境变量示例
├── public/
│   ├── index.html     # 前端页面
│   └── app.js         # 前端逻辑
└── README.md
```

## 注意事项

- **不要**将 `.env` 文件提交到 Git 仓库，它包含敏感 API 密钥
- DeepSeek API 需要单独申请，详见 [DeepSeek 开放平台](https://platform.deepseek.com/)

## License

MIT
