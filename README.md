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
- **AI**：Claude API (Anthropic)
- **部署**：Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

复制 `.env.example` 为 `.env`，填入你的 Claude API Key：

```env
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
```

### 3. 启动服务

```bash
npm start
```

访问 http://localhost:3000 即可使用。

## 获取 Claude API Key

1. 打开 https://console.anthropic.com/
2. 注册/登录 Anthropic 账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制 Key（格式：`sk-ant-api03-xxxxxxxx`）

## 在线体验

**已部署地址**：https://ai-meeting-notes-blue.vercel.app

> 注意：需要配置 Claude API Key 才能使用 AI 功能

## 部署到 Vercel

### 自动部署（推荐）

1. Fork 本项目到你的 GitHub
2. 登录 [Vercel](https://vercel.com)
3. 点击 "New Project" → 导入你的 GitHub 仓库
4. 在项目设置中添加环境变量 `ANTHROPIC_API_KEY`
5. Deploy 完成！

### 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Claude API 密钥 | 是 |

## 项目结构

```
├── server.js          # Express 后端服务
├── package.json       # 项目配置
├── vercel.json        # Vercel 配置
├── .env.example       # 环境变量示例
├── public/
│   ├── index.html     # 前端页面
│   └── app.js         # 前端逻辑
└── README.md
```

## 注意事项

- **不要**将 `.env` 文件提交到 Git 仓库，它包含敏感 API 密钥
- Claude API 需要单独申请，详见 [Anthropic Console](https://console.anthropic.com/)

## License

MIT
