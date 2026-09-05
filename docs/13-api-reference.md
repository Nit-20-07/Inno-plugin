# 13. REST API Endpoint Reference Guide

## 13.1 Module Installer & Management APIs

| Endpoint Path | HTTP Method | Auth Required | Description |
|---|---|---|---|
| `/api/modules` | `GET` | Authenticated | Lists available and installed modules for user's account. |
| `/api/modules/{module_name}/install` | `POST` | Account Admin | Triggers 5-Engine installation pipeline for specified module. |
| `/api/modules/{module_name}/uninstall` | `POST` | Account Admin | Triggers module uninstallation and cleanup. |
| `/api/modules/{module_name}/views` | `GET` | Authenticated | Fetches JSON view schemas (`views/*.json`) for frontend rendering. |

---

## 13.2 Data Access REST APIs

| Endpoint Path | HTTP Method | Auth Required | Description |
|---|---|---|---|
| `/api/data/{model_name}` | `GET` | Authenticated | CRUD Read: Queries records from `mod_<module>_<model>` with security checks. |
| `/api/data/{model_name}` | `POST` | Authenticated | CRUD Create: Inserts new record with security checks. |
| `/api/data/{model_name}/{id}` | `PUT` | Authenticated | CRUD Update: Updates existing record with security checks. |
| `/api/data/{model_name}/{id}` | `DELETE` | Authenticated | CRUD Delete: Soft-deletes record (`deleted_at = NOW()`) with security checks. |

---

## Command Line API Test Snippet

```powershell
# Command line to test list available modules endpoint
Invoke-RestMethod -Uri "http://localhost:8001/api/modules" -Method Get

# Command line to fetch view schema for invoicing model
Invoke-RestMethod -Uri "http://localhost:8001/api/modules/invoicing/views" -Method Get
```
