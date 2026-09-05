# 14. Developer Workflow, Testing & Troubleshooting

## 14.1 Authoring a New Module Step-by-Step

1. **Create Directory**: Create `modules/<my_module_name>/`.
2. **Author `manifest.json`**: Define `name`, `version`, `module_type: "main"`, and `models: ["<my_model>"]`.
3. **Define Declarative Models**: Create `models/<my_model>.json` with field names, types (`string`, `numeric`, `relation`), namespaced relation targets (`"other_mod.target"`), and constraints.
4. **Define Security Policies**: Create `security/access.json` declaring role CRUD permissions.
5. **Define UI Views**: Create `views/<my_model>_list.json` and `views/<my_model>_form.json`.
6. **Test Installation**: Issue API call to `/api/modules/<my_module_name>/install`.

---

## 14.2 Local Testing & Debugging Workflow

- **Database Inspection**: Verify table creation in database: `SELECT * FROM sys_model WHERE module_name = 'my_module';`
- **View Schema Verification**: Test view loading endpoint: `curl -H "Authorization: Bearer <token>" http://localhost:8001/api/modules/my_module/views`
- **Container Log Monitoring**: Inspect container outputs: `docker compose logs -f`

---

## 14.3 Common Errors & Remediation Guide

| Error Message / Symptom | Root Cause | Remediation Step |
|---|---|---|
| `Invalid identifier 'X': must match regex...` | Malicious or malformed module field name/table name. | Ensure identifier contains only lowercase letters, numbers, and underscores (`^[a-z0-9_]{1,63}$`). |
| `Module 'X' requires missing dependencies: Y` | Dependency module `Y` is not installed for account. | Install module `Y` prior to installing module `X`. |
| `relation_target 'X' must be in 'module.model' format` | Bare model name used without namespace. | Update `relation_target` to fully qualified format (e.g. `"contacts_base.contact"`). |
| `Cannot link relation field 'A.b' -> 'C': target model not installed` | Relation target model `C` does not exist in `sys_model`. | Ensure target module owning model `C` is listed in `depends`. |
| `Permission Error: Module 'X' did not declare dependency...` | Cross-module function call attempted without declaration in `uses.json`. | Add dependency declaration into `integrations/uses.json`. |
| `SchemaValidationError: Missing required payload key` | Inter-module function call payload failed JSON input/output schema check. | Fix call arguments to match exposed function `input_schema`. |

---

## Command Line Debugging Code

```powershell
# Command line to check server API response status
Invoke-WebRequest -Uri "http://localhost:8001/health" | Select-Object StatusCode, StatusDescription
```
