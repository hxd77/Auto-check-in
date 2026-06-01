# setup script
$TaskName = "AutoCheckIn-SignInCST"
$ScriptDir = "C:\Users\DELL\Desktop\Auto-check-in"
$NodePath = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $NodePath) { Write-Error "Node.js not found"; exit 1 }
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) { Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false; Write-Host "Old task removed" }
$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "\"$ScriptDir\checkin.js\"" -WorkingDirectory $ScriptDir
$Trigger = New-ScheduledTaskTrigger -Daily -At "08:00"
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Auto Check-In" -Force
Write-Host "Task created successfully"
