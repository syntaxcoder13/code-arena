Write-Host "Ensuring PostgreSQL is running..." -ForegroundColor Cyan
& "$PSScriptRoot\start-db.ps1"

Write-Host "Launching Backend API (http://localhost:5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

Write-Host "Launching Frontend Web App (http://localhost:3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Code Arena is running!" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend:  http://localhost:5000" -ForegroundColor White

