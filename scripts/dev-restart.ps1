# 停止占用 8080 的旧进程并启动 tModWebTools（需 Java 21）
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$JavaHome = "C:\Program Files\Microsoft\jdk-21.0.6.7-hotspot"

if (-not (Test-Path $JavaHome)) {
  Write-Error "未找到 Java 21：$JavaHome"
}

Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

$env:JAVA_HOME = $JavaHome
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

Set-Location $ProjectRoot
Write-Host "Starting tModWebTools on http://127.0.0.1:8080/ ..."
& "$ProjectRoot\mvnw.cmd" spring-boot:run
