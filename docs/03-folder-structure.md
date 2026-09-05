# 3. Complete Declarative Module Folder Structure

## 3.1 Master Directory Layout Diagram

```
modules/<module_name>/
├── manifest.json              ← REQUIRED: Manifest specification (Engine 1)
├── models/                    ← REQUIRED: Declarative JSON model specifications (Engine 2)
│   ├── <model_1>.json         ← Declarative field specs & relationships
│   └── <model_2>.json
├── security/                  ← REQUIRED: RBAC & ABAC Security Policy Declarations (Engine 4)
│   └── access.json            ← Role definitions, model access, field access rules
├── secrets/                   ← OPTIONAL: Declarative secret credential requirements (Engine 4)
│   └── schema.json            ← Declares required secrets (e.g. API keys) without values
├── views/                     ← REQUIRED: UI View Specifications (Engine 5)
│   ├── <model_1>_list.json    ← Data Table column specs & widget options
│   ├── <model_1>_form.json    ← Form layout, section definitions & field inputs
│   └── assets/                ← OPTIONAL: Custom UI widget assets (IFrame sandboxed)
│       ├── style.css          ← Custom styling for widget
│       └── widget.js          ← Sandboxed JavaScript (postMessage protocol)
├── integrations/              ← OPTIONAL: Cross-module required function specs (Engine 3)
│   └── uses.json              ← Declares dependencies on other modules' exposed functions
├── functions/                 ← OPTIONAL: Cross-module exposed function contracts (Engine 3)
│   └── exposes.json           ← Declares integration functions offered to other modules
├── default_data/              ← OPTIONAL: Default seed data
│   ├── roles.json             ← Additional system roles
│   └── field_rules.json       ← Default field-level validation rules
├── migrations/                ← OPTIONAL: Versioned schema migration files
│   └── 1.0.0_to_1.1.0.json   ← Incremental field additions & alterations
└── hooks/                     ← OPTIONAL: Sandboxed lifecycle event hooks
    └── hooks.json             ← Configures on_install and on_uninstall callbacks
```

---

## 3.2 Detailed Inventory of File Responsibilities

| File Path | Format | Required | Engine Responsible | Primary Purpose |
|---|---|---|---|---|
| `manifest.json` | JSON | **YES** | Engine 1 (Manifest) | Module metadata, version, platform requirements, provenance signatures, dependencies, uninstall retention policy. |
| `models/<model>.json` | JSON | **YES** (for Main) | Engine 2 (Database) | Field names, data types, validation constraints, relationship targets. |
| `security/access.json` | JSON | **YES** | Engine 4 (Security) | Role-to-model access matrix, field-level read/write rules, ABAC domain filters. |
| `secrets/schema.json` | JSON | Optional | Engine 4 (Security) | Declares required module secret key names and descriptions for platform vault input. |
| `views/<model>_list.json` | JSON | Recommended | Engine 5 (UI) | List view grid columns, sorting, filtering, action buttons, column widgets. |
| `views/<model>_form.json` | JSON | Recommended | Engine 5 (UI) | Form layout sections, field input controls, widget options, validation rules. |
| `views/assets/*` | CSS/JS | Optional | Engine 5 (UI) | Custom widget assets loaded exclusively in sandboxed `<iframe sandbox="allow-scripts">`. |
| `integrations/uses.json` | JSON | Optional | Engine 3 (Integration) | Declarative list of integration functions required from other installed modules. |
| `functions/exposes.json` | JSON | Optional | Engine 3 (Integration) | Exposed integration function definitions with strict JSON input/output schemas. |
| `migrations/*.json` | JSON | Optional | Engine 2 (Database) | Incremental schema evolution DDL instructions for module upgrades. |
| `hooks/hooks.json` | JSON | Optional | Lifecycle Engine | Declarative bindings for sandboxed `on_install` and `on_uninstall` events. |

---

## 3.3 Mandatory vs Optional Files Checklist

- [x] `manifest.json` (Mandatory for all modules)
- [x] `models/*.json` (Mandatory for Main Modules; prohibited for Extension Modules)
- [x] `security/access.json` (Mandatory for all modules)
- [ ] `secrets/schema.json` (Optional; required only if module needs external API credentials/keys)
- [ ] `views/*.json` (Optional; if missing, Engine 5 auto-generates view specs from `sys_field`)
- [ ] `views/assets/` (Optional; required only if module uses custom IFrame widgets)
- [ ] `integrations/uses.json` (Optional; required only if module calls another module's exposed functions)
- [ ] `functions/exposes.json` (Optional; required only if module offers functions to other modules)
- [ ] `migrations/*.json` (Optional; required only when upgrading module versions)

---

## 3.4 Deep-Dive Inventory: Purpose, Role & Allowed Contents of Every File & Directory

This section provides an exhaustive item-by-item breakdown of every directory and file in the UNIVA declarative module architecture.

### 1. `manifest.json` (Module Manifest Descriptor)
- **What it is**: The root metadata file for every module.
- **What it does**: Defines module identity, module type classification (`main` vs `extension`), platform version limits (`requires_platform_version`), publisher cryptographic provenance (`provenance`), models owned (`models`), prerequisites (`depends`), required/exposed functions (`requires_integration`, `exposes_integration`), default system roles (`default_roles`), and uninstall retention policy (`uninstall_policy`).
- **Engine Responsible**: **Engine 1 (Manifest Engine)**.
- **What can be inside it**: A single JSON object at module root conforming strictly to the UNIVA Manifest JSON Schema draft-07.
- **Example**:
  ```json
  {
    "name": "invoicing",
    "display_name": "Invoicing & Billing Management",
    "version": "1.0.0",
    "requires_platform_version": ">=2.4.0 <3.0.0",
    "module_type": "main",
    "provenance": {
      "publisher_id": "univa:vendor:acme-corp",
      "package_sha256": "e3b0c4429...",
      "signature": "base64-ed25519-sig",
      "signing_key_id": "acme-corp-2026-01"
    },
    "uninstall_policy": { "data_retention": "archive", "archive_after_days": 30 },
    "depends": [],
    "models": ["invoice", "invoice_line"],
    "requires_integration": ["users.get_user"],
    "exposes_integration": ["invoicing.get_invoice_total"]
  }
  ```

### 2. `models/` Directory (Declarative SQL Table Schemas)
- **What it is**: The database model definition directory.
- **What it does**: Declares physical table names (`mod_<module>_<model>`), model labels, and field specifications (`type`, `required`, `unique`, `relation_target`, `default`). Engine 2 parses these files to materialize SQL tables, partial unique indexes, system catalog entries (`sys_model`, `sys_field`), and system columns (`id`, `account_id`, `created_at`, `updated_at`, `deleted_at`).
- **Engine Responsible**: **Engine 2 (Database Engine)**.
- **What can be inside it**: JSON files named `<model_name>.json` (e.g., `invoice.json`, `invoice_line.json`). *Prohibited in Extension modules (`models: []`).*
- **Example (`models/invoice.json`)**:
  ```json
  {
    "name": "invoice",
    "table_name": "mod_invoicing_invoice",
    "label": "Customer Invoice",
    "fields": [
      { "name": "number", "type": "string", "required": true, "unique": true, "label": "Invoice Number" },
      { "name": "customer_id", "type": "relation", "relation_target": "contacts_base.contact", "required": true, "label": "Customer" },
      { "name": "total_amount", "type": "numeric", "required": true, "default": 0.00, "label": "Total Amount" }
    ]
  }
  ```

### 3. `security/` Directory (RBAC Matrix & ABAC Rules)
- **What it is**: The security access policy directory.
- **What it does**: Declares tenant roles, model CRUD access (`create`, `read`, `update`, `delete`), field-level read/write permissions, and ABAC record-level rules (`domain_filter`) with operator whitelisting (`ALLOWED_OPERATORS`).
- **Engine Responsible**: **Engine 4 (Security Engine)**.
- **What can be inside it**: A single `access.json` file.
- **Example (`security/access.json`)**:
  ```json
  {
    "roles": {
      "invoicing_manager": {
        "display_name": "Invoicing Manager",
        "model_access": {
          "invoice": { "create": true, "read": true, "update": true, "delete": true }
        },
        "field_access": {
          "invoice": { "total_amount": { "read": true, "write": true } }
        }
      }
    },
    "abac_rules": [
      {
        "role": "farmer",
        "model": "farm",
        "domain_filter": { "field": "region_id", "operator": "=", "value_source": "user_property.region_id" }
      }
    ]
  }
  ```

### 4. `secrets/` Directory (Declarative Credential Requirements)
- **What it is**: The secret requirement declaration directory.
- **What it does**: Declares external API keys or credentials required by the module. Engine 4 uses this to prompt tenant admins in the platform vault UI. Secret values are stored envelope-encrypted in `sys_secret` via KMS and accessed at runtime via SDK call `get_secret(key)`.
- **Engine Responsible**: **Engine 4 (Security Engine)**.
- **What can be inside it**: A single `schema.json` file. *Never contains raw secret values or keys.*
- **Example (`secrets/schema.json`)**:
  ```json
  {
    "required_secrets": [
      { "key": "STRIPE_API_KEY", "description": "Stripe secret key for payment processing" }
    ]
  }
  ```

### 5. `views/` Directory & `views/assets/` Subdirectory (UI Screens & Sandboxed Widgets)
- **What it is**: The UI view specification and custom widget assets directory.
- **What it does**: `views/*.json` files declare data table list views (`<model>_list.json`) and sectioned form layouts (`<model>_form.json`) registered into `sys_view`. `views/assets/` contains static custom widget files loaded exclusively inside sandboxed `<iframe>` elements.
- **Engine Responsible**: **Engine 5 (UI Engine)**.
- **What can be inside it**: `<model>_list.json` and `<model>_form.json` view spec files, and `assets/` subfolder containing `style.css` and `widget.js` (using `window.HOST_ORIGIN` postMessage protocol).
- **Example (`views/invoice_list.json`)**:
  ```json
  {
    "view_type": "list",
    "model": "invoice",
    "title": "Invoices",
    "columns": [
      { "field": "number", "label": "Invoice #", "sortable": true },
      { "field": "total_amount", "label": "Total", "widget": "currency" }
    ]
  }
  ```

### 6. `integrations/` Directory (Required Function Dependencies)
- **What it is**: The cross-module required integration contract directory.
- **What it does**: Engine 3 checks `uses.json` at install time to verify that all external module functions called by this module exist in installed target modules.
- **Engine Responsible**: **Engine 3 (Integration Engine)**.
- **What can be inside it**: A single `uses.json` file.
- **Example (`integrations/uses.json`)**:
  ```json
  {
    "requires": [
      { "module": "users", "function": "get_user" }
    ]
  }
  ```

### 7. `functions/` Directory (Exposed Integration Functions)
- **What it is**: The exposed function contracts directory.
- **What it does**: Declares cross-module functions exposed by this module to other modules, including strict input and output JSON schemas. Registered into system `FunctionRegistry`.
- **Engine Responsible**: **Engine 3 (Integration Engine)**.
- **What can be inside it**: A single `exposes.json` file.
- **Example (`functions/exposes.json`)**:
  ```json
  {
    "functions": [
      {
        "name": "get_invoice_total",
        "description": "Returns total billing amount for invoice ID",
        "input_schema": { "invoice_id": "string" },
        "output_schema": { "invoice_id": "string", "total_amount": "numeric", "currency": "string" },
        "implementation": "invoicing.services.get_invoice_total"
      }
    ]
  }
  ```

### 8. `default_data/` Directory (Seed Data & System Roles)
- **What it is**: The default seed data directory.
- **What it does**: Seeds default master data records, additional system roles, or default field validation rules during installation Stage 4.
- **Engine Responsible**: **Engine 4 & Installer Engine**.
- **What can be inside it**: `roles.json`, `field_rules.json`, or default record JSON files.
- **Example (`default_data/roles.json`)**:
  ```json
  {
    "additional_roles": [
      { "name": "auditor", "display_name": "Audit Inspector", "can_install_modules": false }
    ]
  }
  ```

### 9. `migrations/` Directory (Incremental Schema Evolution)
- **What it is**: The versioned database migration scripts directory.
- **What it does**: Engine 2 executes declarative DDL alterations (`add_column`, `alter_column`, `drop_column`) when upgrading an installed module from version X to version Y.
- **Engine Responsible**: **Engine 2 (Database Engine)**.
- **What can be inside it**: Versioned JSON files named `<from_version>_to_<to_version>.json` (e.g. `1.0.0_to_1.1.0.json`).
- **Example (`migrations/1.0.0_to_1.1.0.json`)**:
  ```json
  {
    "from_version": "1.0.0",
    "to_version": "1.1.0",
    "operations": [
      {
        "type": "add_column",
        "model": "invoice",
        "field": { "name": "notes", "type": "string", "required": false, "label": "Invoice Notes" }
      }
    ]
  }
  ```

### 10. `hooks/` Directory (Sandboxed Event Callbacks)
- **What it is**: The post-commit lifecycle event bindings directory.
- **What it does**: Declares `on_install` and `on_uninstall` callback functions executed post-commit inside an isolated gVisor (`runsc`) container sandbox with 4 allowlisted SDK calls (`call_integration`, `get_record`, `emit_audit_log`, `get_secret`).
- **Engine Responsible**: **Lifecycle Engine**.
- **What can be inside it**: A single `hooks.json` file.
- **Example (`hooks/hooks.json`)**:
  ```json
  {
    "on_install": "hooks.on_install",
    "on_uninstall": "hooks.on_uninstall"
  }
  ```

---

## Command Line Directory Audit Code

```powershell
# Command line to inspect folder tree for a specific module
Get-ChildItem -Path "modules/invoicing" -Recurse | Select-Object RelativeName, Length
```
