# 设置 Windows 定时任务 — 每天自动打卡
# 用法: 以管理员身份运行 PowerShell，执行 .\setup-scheduler.ps1

$TaskName = "AutoCheckIn-SignInCST"
$ScriptDir = "C:\Users\DELL\Desktop\自动打卡"
$NodePath = (Get-Command node.exe -ErrorAction SilentlyContinue).Source

if (-not $NodePath) {
  Write-Error "未找到 Node.js，请先安装 Node.js"
  exit 1
}

# 删除旧任务（如果存在）
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "已删除旧的定时任务"
}

# 创建新任务 — 每天早上 8:00 执行
$Action = New-ScheduledTaskAction `
  -Execute $NodePath `
  -Argument "`"$ScriptDir\checkin.js`"" `
  -WorkingDirectory $ScriptDir

# 每天 8:00 触发
$Trigger = New-ScheduledTaskTrigger `
  -Daily `
  -At "08:00"

# 配置：不并行运行，超时 5 分钟
$Settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 5)

# 以当前用户身份运行
$Principal = New-ScheduledTaskPrincipal `
  -UserId $env:USERNAME `
  -LogonType Interactive `
  -RunLevel Limited

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Principal $Principal `
  -Description "自动打卡 Sign In CST - 每天 8:00 执行" `
  -Force

Write-Host "定时任务 '$TaskName' 已创建，每天 8:00 自动运行"
Write-Host "运行 'taskschd.msc' 打开任务计划程序查看/修改"
