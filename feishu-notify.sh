#!/bin/bash
# 飞书通知脚本 - 在 Claude Code Stop hook 时触发
# 用法：将飞书 Webhook URL 设置在环境变量 FEISHU_WEBHOOK_URL 中

WEBHOOK_URL="${FEISHU_WEBHOOK_URL:-}"
if [ -z "$WEBHOOK_URL" ]; then
  echo "[feishu-notify] FEISHU_WEBHOOK_URL not set, skipping notification"
  exit 0
fi

HOSTNAME=$(hostname 2>/dev/null || echo "unknown")
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"msg_type\": \"text\",
    \"content\": {
      \"text\": \"[Claude Code] Session stopped on ${HOSTNAME} at ${TIMESTAMP}\"
    }
  }" > /dev/null 2>&1

echo "[feishu-notify] Notification sent"
