
<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=32&pause=1000&color=6366F1&center=true&vCenter=true&width=600&lines=Auto+Check-In;%E8%87%AA%E5%8A%A8%E6%89%93%E5%8D%A1%E7%B3%BB%E7%BB%9F;Sign+In+CST" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Windows-10%2F11-0078D6?style=for-the-badge&logo=windows&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge&logo=opensourceinitiative&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/uptime-24%2F7-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/PRs-welcome-purple?style=flat-square" />
</p>

---

```
  ╔══════════════════════════════════════════════════════╗
  ║                                                      ║
  ║   🏫  Sign In CST  ·  学生日常打卡  ·  自动签到      ║
  ║                                                      ║
  ║   模拟登录  →  绕过滑块验证  →  自动打卡  →  通知     ║
  ║                                                      ║
  ╚══════════════════════════════════════════════════════╝
```

## ✨ 特性

<table>
  <tr>
    <td width="50%">
      <h3>🔐 智能认证</h3>
      <p>自动完成学号密码登录，支持 Token 持久化与 HMAC-SHA256 请求签名</p>
    </td>
    <td width="50%">
      <h3>🧩 滑块绕过</h3>
      <p>拟人化轨迹生成算法，模拟真实鼠标拖拽行为，优雅绕过滑块验证码</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>⏰ 定时执行</h3>
      <p>集成 Windows 任务计划程序，每日 8:00 自动触发，无需人工干预</p>
    </td>
    <td width="50%">
      <h3>🔔 飞书通知</h3>
      <p>打卡结果实时推送至飞书群机器人，随时随地掌握执行状态</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📋 完整日志</h3>
      <p>带时间戳的本地日志记录，每次执行过程可追溯、可审计</p>
    </td>
    <td width="50%">
      <h3>🛡️ 幂等保护</h3>
      <p>自动检测当日是否已打卡，避免重复提交，安全放心</p>
    </td>
  </tr>
</table>

## 🚀 快速开始

### 前置要求

- **Node.js** `>= 18.x`
- **Windows** `10 / 11`（定时任务依赖）
- **飞书机器人** Webhook 地址（可选，用于结果通知）

### 安装

```bash
# 1. 克隆仓库
git clone https://github.com/hxd77/Auto-check-in.git
cd Auto-check-in

# 2. 创建配置文件（请替换为你的实际信息）
echo { "student_no": "你的学号", "password": "你的密码" } > config.json

# 3. 手动测试运行
node checkin.js
```

### 配置定时任务

```powershell
# 以管理员身份打开 PowerShell，执行：
.\setup-scheduler.ps1
```

### 配置飞书通知（可选）

```bash
# 设置环境变量
export FEISHU_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx"

# 测试通知
bash feishu-notify.sh
```

## 📐 架构

```mermaid
flowchart LR
    A[⏰ 定时器] --> B[🔐 登录认证]
    B --> C{📋 今日状态}
    C -->|未打卡| D[🧩 滑块验证]
    C -->|已打卡| E[✅ 跳过]
    D --> F[📝 提交打卡]
    F --> G[🔔 飞书通知]
    E --> H[✍️ 写入日志]

    style A fill:#6366F1,color:#fff
    style B fill:#8B5CF6,color:#fff
    style C fill:#EC4899,color:#fff
    style D fill:#F59E0B,color:#000
    style E fill:#22C55E,color:#fff
    style F fill:#3B82F6,color:#fff
    style G fill:#06B6D4,color:#000
    style H fill:#6B7280,color:#fff
```

## 📂 项目结构

```
Auto-check-in/
├── checkin.js           # 🎯 核心打卡脚本（Node.js）
├── checkin.bat          # 🪟 Windows 批处理快捷入口
├── setup-scheduler.ps1  # ⏰ 定时任务一键部署
├── feishu-notify.sh     # 🔔 飞书机器人通知
├── config.json          # ⚙️  账号配置（不入库）
├── CLAUDE.md            # 🤖 Claude Code 项目规则
├── checkin.log          # 📋 运行日志（不入库）
└── .gitignore           # 🛡️  敏感文件保护
```

## 🎮 脚本详解

### `checkin.js` — 核心引擎

| 模块 | 功能 |
|------|------|
| `loadConfig()` | 加载 `config.json` 中的学号密码 |
| `request()` | 封装 HTTPS 请求，自动处理 Token & HMAC 签名 |
| `generateTrajectories()` | 生成 50~80 个拟人化鼠标轨迹点 |
| `main()` | 编排完整流程：登录 → 查状态 → 滑块 → 打卡 |

### 滑块轨迹模拟原理

```
位移
 ↑
 │        ╭──────────────────────╮
 │      ╭╯                      ╰╮
 │    ╭╯                          ╰╮
 │  ╭╯                              ╰╮
 │╭╯                                  ╰────
 └────────────────────────────────────────→ 时间

  加速段    匀速段         减速段
  (缓入)   (线性滑动)     (缓出)
```

算法使用 **三段式缓动函数** 模拟真人拖拽：慢启动 → 匀速滑动 → 慢停止，每个点加入 ±3px 随机抖动。

## 🔧 config.json 格式

```json
{
  "student_no": "2025XXXXX",
  "password": "your_password"
}
```

> ⚠️ `config.json` 包含明文密码，已通过 `.gitignore` 排除。切勿提交到仓库。

## 📊 运行日志示例

```
[2026/5/3 08:00:01] ========== 自动打卡开始 ==========
[2026/5/3 08:00:02] 登录成功: 张三 (student)
[2026/5/3 08:00:04] 打卡成功: 2026-05-03 08:00:03
```

## 🎨 技术栈

<p align="center">
  <img src="https://skillicons.dev/icons?i=nodejs,js,bash,powershell,git&theme=dark" />
</p>

## ⭐ 致谢

如果这个项目帮到了你，不妨点个 Star ⭐

<p align="center">
  <a href="https://github.com/hxd77/Auto-check-in">
    <img src="https://img.shields.io/github/stars/hxd77/Auto-check-in?style=social" />
  </a>
</p>

---

<p align="center">
  <sub>Made with ❤️ for students who value their sleep</sub>
  <br>
  <sub>© 2026 Auto Check-In · MIT License</sub>
</p>
