# 5. Engine 1 — Manifest Engine & Specification (`manifest.json`)

## 5.1 Complete JSON Schema & Validation Rules

`manifest.json` MUST be valid JSON and conform strictly to the following draft-07 specification:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UNIVA Module Manifest",
  "type": "object",
  "required": ["name", "version", "module_type", "models"],
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[a-z0-9_]{1,63}$",
      "description": "Unique identifier of the module (lowercase letters, numbers, underscores)."
    },
    "display_name": {
      "type": "string",
      "description": "Human-readable module title displayed in Module Store."
    },
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$",
      "description": "Semantic versioning string (e.g. 1.0.0)."
    },
    "requires_platform_version": {
      "type": "string",
      "description": "SemVer range requirement for host UNIVA platform (e.g. '>=2.4.0 <3.0.0')."
    },
    "module_type": {
      "type": "string",
      "enum": ["main", "extension"],
      "description": "Module type classification."
    },
    "target_app": {
      "type": "string",
      "default": "all",
      "description": "Target frontend application context ('sis_web', 'all')."
    },
    "provenance": {
      "type": "object",
      "required": ["publisher_id", "package_sha256", "signature", "signing_key_id"],
      "properties": {
        "publisher_id": { "type": "string", "description": "Publisher identifier (e.g. 'univa:vendor:acme-corp')." },
        "package_sha256": { "type": "string", "description": "SHA-256 hash of packaged module archive." },
        "signature": { "type": "string", "description": "Ed25519 signature of the package hash." },
        "signing_key_id": { "type": "string", "description": "Identifier of the trusted signing key." }
      }
    },
    "uninstall_policy": {
      "type": "object",
      "properties": {
        "data_retention": {
          "type": "string",
          "enum": ["drop_immediately", "archive", "retain_orphaned"],
          "default": "archive",
          "description": "Table handling strategy during module uninstall."
        },
        "archive_after_days": {
          "type": "integer",
          "default": 30,
          "description": "Retention window before scheduled purge of archived tables."
        }
      }
    },
    "depends": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Prerequisite module names that MUST be installed prior to this module."
    },
    "models": {
      "type": "array",
      "items": { "type": "string", "pattern": "^[a-z0-9_]{1,63}$" },
      "description": "List of model names owned by this module."
    },
    "requires_integration": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of required integration functions in 'module_name.function_name' format."
    },
    "exposes_integration": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of integration functions exposed by this module."
    },
    "default_roles": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Role identifiers seeded into system upon installation."
    },
    "description": {
      "type": "string",
      "description": "Detailed description of module capabilities."
    }
  }
}
```

---

## 5.2 Extended Dependency Declarations (`depends`, `requires_integration`, `exposes_integration`)

```json
{
  "name": "invoicing",
  "display_name": "Invoicing & Billing Management",
  "version": "1.0.0",
  "module_type": "main",
  "target_app": "sis_web",
  "depends": ["contacts_base"],
  "models": ["invoice", "invoice_line"],
  "default_roles": ["invoicing_manager", "billing_viewer"],
  "requires_integration": [
    "contacts_base.get_contact",
    "users.get_user"
  ],
  "exposes_integration": [
    "invoicing.get_invoice_total",
    "invoicing.list_open_invoices"
  ],
  "description": "Enterprise billing, invoice lines, payment tracking, and financial integration."
}
```

1. **`depends` Check**: Before installing `invoicing`, Engine 1 verifies that `contacts_base` is already installed and enabled for `account_id`. If missing, install halts immediately with `ModuleInstallError`.
2. **`requires_integration` Check**: Engine 1 verifies that `contacts_base.get_contact` and `users.get_user` function contracts are registered and exposed in the system function catalog.

---

## 5.3 Manifest Reference Table

| Field | Required | Type | Validation Constraint | Description |
|---|---|---|---|---|
| `name` | **YES** | `string` | Regex `^[a-z0-9_]{1,63}$` | Unique module system identifier. |
| `display_name` | No | `string` | Max 150 chars | Human-readable title. |
| `version` | **YES** | `string` | SemVer `X.Y.Z` | Version indicator. |
| `module_type` | **YES** | `string` | `"main"` or `"extension"` | Module classification. |
| `target_app` | No | `string` | `"sis_web"` or `"all"` | Target application environment. |
| `depends` | No | `array` | List of module names | Hard prerequisite module list. |
| `models` | **YES** | `array` | List of safe identifiers | Models owned by this module. |
| `requires_integration` | No | `array` | List of `"module.func"` | Machine-checkable function dependencies. |
| `exposes_integration` | No | `array` | List of `"module.func"` | Exposed function contracts provided to system. |
| `default_roles` | No | `array` | List of role name strings | Default role names seeded at install time. |

---

## Command Line Validation Code

```powershell
# Command line to validate all manifest files against JSON syntax
Get-ChildItem -Path "modules" -Filter "manifest.json" -Recurse | ForEach-Object {
    try {
        $json = Get-Content $_.FullName | ConvertFrom-Json
        Write-Host "Valid manifest: $($json.name) v$($json.version)" -ForegroundColor Green
    } catch {
        Write-Host "Invalid manifest JSON in $($_.FullName)" -ForegroundColor Red
    }
}
```
