# Read DATABASE_URL from backend/.env.local if available
$envFile = "$PSScriptRoot\backend\.env.local"
$isLocalDb = $true

if (Test-Path $envFile) {
    $dbLine = Get-Content $envFile | Where-Object { $_ -match "^DATABASE_URL=" } | Select-Object -First 1
    if ($dbLine -and ($dbLine -notmatch "127\.0\.0\.1" -and $dbLine -notmatch "localhost")) {
        $isLocalDb = $false
    }
}

if (-not $isLocalDb) {
    Write-Host "Connected to Cloud Database (Neon PostgreSQL)." -ForegroundColor Green
    exit 0
}

$pgCtl = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
$dbPath = "$PSScriptRoot\.local\postgres"
$logPath = "$PSScriptRoot\.local\postgres.log"

if (Test-Path $pgCtl) {
    Write-Host "Checking local PostgreSQL status on port 55432..." -ForegroundColor Cyan
    $status = & $pgCtl -D $dbPath status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Local PostgreSQL is already running." -ForegroundColor Green
    } else {
        Write-Host "Starting local PostgreSQL on port 55432..." -ForegroundColor Yellow
        & $pgCtl -D $dbPath -l $logPath -o "-h 127.0.0.1 -p 55432" start
        Start-Sleep -Seconds 2
        Write-Host "Local PostgreSQL started successfully!" -ForegroundColor Green
    }
}
