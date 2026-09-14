#!/usr/bin/env pwsh
param(
    [switch]$Build,
    [switch]$Stop,
    [switch]$Clean,
    [switch]$Logs,
    [switch]$Status,
    [switch]$Help,
    [switch]$Seed
)

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Show-Help {
    Write-ColorOutput "小石榴图文社区 Docker 部署脚本" "Cyan"
    Write-ColorOutput "用法: .\deploy.ps1 [选项]" "Yellow"
    Write-ColorOutput "" 
    Write-ColorOutput "选项:" "Green"
    Write-ColorOutput "  -Build    强制重新构建镜像并启动服务" "White"
    Write-ColorOutput "  -Stop     停止所有服务" "White"
    Write-ColorOutput "  -Clean    清理所有容器、镜像和数据卷" "White"
    Write-ColorOutput "  -Logs     查看服务日志" "White"
    Write-ColorOutput "  -Status   查看服务状态" "White"
    Write-ColorOutput "  -Seed     启动后灌装示例数据（可选）" "White"
    Write-ColorOutput "  -Help     显示此帮助信息" "White"
}

function Test-Docker {
    try {
        docker --version | Out-Null
        docker compose version | Out-Null
        return $true
    }
    catch {
        Write-ColorOutput "错误: 未找到 Docker 或 Docker Compose" "Red"
        return $false
    }
}

function Wait-ContainerHealthy {
    param(
        [string]$ContainerName,
        [int]$TimeoutSeconds = 120
    )
    $start = Get-Date
    while ((Get-Date) - $start -lt [TimeSpan]::FromSeconds($TimeoutSeconds)) {
        try {
            $status = docker inspect -f '{{.State.Health.Status}}' $ContainerName 2>$null
            if ($status -and $status.Trim() -eq 'healthy') { return $true }
        }
        catch { }
        Start-Sleep -Seconds 2
    }
    return $false
}

function Seed-Data {
    Write-ColorOutput "准备灌装示例数据..." "Cyan"
    $mysqlHealthy = Wait-ContainerHealthy -ContainerName 'xiaoshiliu-mysql' -TimeoutSeconds 180
    $backendHealthy = Wait-ContainerHealthy -ContainerName 'xiaoshiliu-backend' -TimeoutSeconds 180

    if (-not $mysqlHealthy -or -not $backendHealthy) {
        Write-ColorOutput "等待服务健康超时，跳过灌装。" "Yellow"
        return
    }

    Write-ColorOutput "开始灌装数据（时间较长请耐心等待）..." "Yellow"
    docker compose -p xiaoshiliu exec -T backend node scripts/generate-data.js
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "灌装完成" "Green"
    }
    else {
        Write-ColorOutput "灌装失败，请查看日志" "Red"
    }
}

function Start-Services {
    Write-ColorOutput "启动小石榴图文社区服务..." "Green"

    if ($Build) {
        Write-ColorOutput "重新构建镜像..." "Yellow"
        docker compose -p xiaoshiliu down
        docker compose -p xiaoshiliu build --no-cache
    }

    docker compose -p xiaoshiliu up -d
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "服务启动成功!" "Green"
        Write-ColorOutput "访问地址:" "Cyan"
        Write-ColorOutput "  前端: http://localhost:8080" "White"
        Write-ColorOutput "  后端API: http://localhost:3001" "White"
        Write-ColorOutput "  数据库: localhost:3307" "White"

        if ($Seed) {
            Seed-Data
        }
    }
    else {
        Write-ColorOutput "服务启动失败!" "Red"
    }
}

function Stop-Services {
    Write-ColorOutput "停止服务..." "Yellow"
    docker compose -p xiaoshiliu down
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "服务已停止" "Green"
    }
    else {
        Write-ColorOutput "停止服务时出现错误" "Red"
    }
}

function Clean-Resources {
    Write-ColorOutput "警告: 此操作将删除所有容器、镜像和数据卷!" "Red"
    $confirmation = Read-Host "确认继续? (y/N)"
    if ($confirmation -match '^[Yy]$') {
        Write-ColorOutput "清理Docker资源..." "Yellow"
        docker compose -p xiaoshiliu down -v --rmi all
        docker system prune -f | Out-Null
        Write-ColorOutput "清理完成" "Green"
    }
    else {
        Write-ColorOutput "操作已取消" "Yellow"
    }
}

function Show-Logs {
    Write-ColorOutput "查看服务日志 (按 Ctrl+C 退出):" "Cyan"
    docker compose -p xiaoshiliu logs -f
}

function Show-Status {
    Write-ColorOutput "服务状态:" "Cyan"
    docker compose -p xiaoshiliu ps
}

if ($Help) {
    Show-Help
    exit 0
}

if (-not (Test-Docker)) {
    exit 1
}

switch ($true) {
    $Clean { Clean-Resources }
    $Logs { Show-Logs }
    $Status { Show-Status }
    $Stop { Stop-Services }
    default { Start-Services }
}

Write-ColorOutput "操作完成" "Green"
