# 12. Complete Worked Module Case Studies

## 12.1 Case Study 1: `farms` Module (Complete Files & Code Specs)

**`modules/farms/` Directory Structure**:
```
modules/farms/
├── manifest.json
├── models/
│   ├── farm.json
│   ├── motor.json
│   ├── valve.json
│   └── sensor.json
├── security/
│   └── access.json
└── views/
    ├── farm_list.json
    └── farm_form.json
```

**`modules/farms/manifest.json`**:
```json
{
  "name": "farms",
  "display_name": "Irrigation Farms",
  "version": "1.0.0",
  "module_type": "main",
  "target_app": "sis_web",
  "depends": [],
  "models": ["farm", "motor", "valve", "sensor"],
  "default_roles": ["farm_admin", "farmer", "viewer"],
  "description": "Core farm plot management, telemetry sensors, motor controls, and valve status."
}
```

**`modules/farms/models/farm.json`**:
```json
{
  "name": "farm",
  "table_name": "mod_farms_farm",
  "label": "Farm Plot",
  "fields": [
    { "name": "name", "type": "string", "required": true, "unique": true, "label": "Farm Name" },
    { "name": "crop", "type": "string", "required": true, "label": "Crop Type" },
    { "name": "master_controller", "type": "string", "required": false, "label": "Controller ID" },
    { "name": "battery_pct", "type": "integer", "required": false, "default": 100, "label": "Battery %" },
    { "name": "power_grid", "type": "string", "required": false, "default": "Normal", "label": "Grid Status" }
  ]
}
```

---

## 12.2 Case Study 2: `invoicing` Module (Complete Files & Code Specs)

**`modules/invoicing/` Directory Structure**:
```
modules/invoicing/
├── manifest.json
├── models/
│   ├── invoice.json
│   └── invoice_line.json
├── security/
│   └── access.json
├── views/
│   ├── invoice_list.json
│   └── invoice_form.json
├── integrations/
│   └── uses.json
├── functions/
│   └── exposes.json
└── hooks/
    └── hooks.json
```

**`modules/invoicing/manifest.json`**:
```json
{
  "name": "invoicing",
  "display_name": "Invoicing & Billing Management",
  "version": "1.0.0",
  "module_type": "main",
  "target_app": "sis_web",
  "depends": [],
  "models": ["invoice", "invoice_line"],
  "default_roles": ["invoicing_manager"],
  "requires_integration": ["users.get_user"],
  "exposes_integration": ["invoicing.get_invoice_total"],
  "description": "Industrial invoicing module with integration function capabilities."
}
```

**`modules/invoicing/models/invoice.json`**:
```json
{
  "name": "invoice",
  "table_name": "mod_invoicing_invoice",
  "label": "Customer Invoice",
  "fields": [
    { "name": "number", "type": "string", "required": true, "unique": true, "label": "Invoice Number" },
    { "name": "customer_id", "type": "relation", "relation_target": "contacts_base.contact", "required": true, "label": "Customer Contact" },
    { "name": "total_amount", "type": "numeric", "required": true, "default": 0.00, "label": "Total Amount" },
    { "name": "status", "type": "string", "default": "draft", "label": "Status" }
  ]
}
```

**`modules/invoicing/integrations/uses.json`**:
```json
{
  "requires": [
    { "module": "users", "function": "get_user" }
  ]
}
```

**`modules/invoicing/functions/exposes.json`**:
```json
{
  "functions": [
    {
      "name": "get_invoice_total",
      "description": "Returns total calculated billing amount for invoice ID",
      "input_schema": { "invoice_id": "string" },
      "output_schema": { "invoice_id": "string", "total_amount": "numeric", "currency": "string" },
      "implementation": "invoicing.services.get_invoice_total"
    }
  ]
}
```

---

## 12.3 Case Study 3: `schedule` Module (Complete Files & Code Specs)

**`modules/schedule/` Directory Structure**:
```
modules/schedule/
├── manifest.json
├── models/
│   └── irrigation_job.json
├── security/
│   └── access.json
└── views/
    ├── irrigation_job_list.json
    └── irrigation_job_form.json
```

**`modules/schedule/manifest.json`**:
```json
{
  "name": "schedule",
  "display_name": "Irrigation Scheduler",
  "version": "1.0.0",
  "module_type": "main",
  "target_app": "sis_web",
  "depends": ["farms"],
  "models": ["irrigation_job"],
  "default_roles": ["schedule_admin", "operator"],
  "description": "Automated irrigation scheduling bound to farms."
}
```

---

## 12.4 Case Study 4: `pdf_exporter` Extension Module (Complete Files & Code Specs)

**`modules/pdf_exporter/` Directory Structure**:
```
modules/pdf_exporter/
├── manifest.json
├── security/
│   └── access.json
└── views/
    └── assets/
        ├── style.css
        └── widget.js
```

**`modules/pdf_exporter/manifest.json`**:
```json
{
  "name": "pdf_exporter",
  "display_name": "PDF Export Tools",
  "version": "1.0.0",
  "module_type": "extension",
  "target_app": "sis_web",
  "depends": [],
  "models": [],
  "ui_extensions": [
    {
      "target_module": "invoicing",
      "target_view": "view_invoice_list",
      "action_type": "button",
      "label": "Export PDF Invoice",
      "icon": "file-text"
    }
  ],
  "description": "Injects PDF export action button into Invoicing view screens."
}
```

---

## Command Line Case Study Audit Code

```powershell
# Command line to inspect all module manifest display names
Get-ChildItem -Path "modules" -Filter "manifest.json" -Recurse | ForEach-Object {
    $c = Get-Content $_.FullName | ConvertFrom-Json
    Write-Host "$($c.name) -> $($c.display_name) ($($c.module_type))"
}
```
