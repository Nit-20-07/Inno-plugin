# 15. Quick Reference Cheatsheet & Terminal Commands

## 15.1 Docker Control Commands

```powershell
# Command line to build and launch all Docker services in detached mode
docker compose up -d --build

# Command line to check running container status and health checks
docker compose ps

# Command line to inspect live combined logs from all containers
docker compose logs -f
```

---

## 15.2 Module Installer Pipeline Commands

```powershell
# Command line to validate JSON files across module folders
Get-ChildItem -Path "modules" -Filter "*.json" -Recurse | ForEach-Object { Get-Content $_.FullName | ConvertFrom-Json }

# Command line to test health endpoint of host installer engine
Invoke-RestMethod -Uri "http://localhost:8001/health" -Method Get
```

---

## 15.3 API Curl / Powershell Test Commands

```powershell
# Command line to test module listing endpoint for account
Invoke-RestMethod -Uri "http://localhost:8001/api/modules" -Method Get

# Command line to test installing farms module via REST API
$body = @{ account_id = "acc_1001" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/api/modules/farms/install" -Method Post -Body $body -ContentType "application/json"

# Command line to fetch view schemas for farms module
Invoke-RestMethod -Uri "http://localhost:8001/api/modules/farms/views" -Method Get
```
