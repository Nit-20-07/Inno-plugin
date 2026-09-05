# 8. Engine 4 — Security Engine & RBAC/ABAC Declarations (`security/access.json`)

## 8.1 Security Engine Responsibilities & Role Seeding

The **Security Engine** seeds access policies into the tenant's security tables:

1. `role`: Tenant-scoped role definitions (`name`, `can_install_modules`).
2. `role_model_access`: Model-level CRUD permissions (`can_create`, `can_read`, `can_write`, `can_delete`).
3. `role_field_access`: Field-level read/write permissions (`can_read`, `can_write`).
4. `role_record_rule`: Attribute-Based Access Control (ABAC) row-level filtering rules (`domain_filter`).

---

## 8.2 Declarative RBAC Matrix (`security/access.json`) Schema

```json
{
  "roles": {
    "invoicing_manager": {
      "display_name": "Invoicing Manager",
      "can_install_modules": false,
      "model_access": {
        "invoice": { "create": true, "read": true, "update": true, "delete": true },
        "invoice_line": { "create": true, "read": true, "update": true, "delete": true }
      },
      "field_access": {
        "invoice": {
          "total_amount": { "read": true, "write": true },
          "status": { "read": true, "write": true }
        }
      }
    },
    "billing_viewer": {
      "display_name": "Billing Viewer",
      "can_install_modules": false,
      "model_access": {
        "invoice": { "create": false, "read": true, "update": false, "delete": false },
        "invoice_line": { "create": false, "read": true, "update": false, "delete": false }
      },
      "field_access": {
        "invoice": {
          "total_amount": { "read": true, "write": false }
        }
      }
    }
  }
}
```

---

## 8.3 ABAC Rules & Record-Level Domain Filters (`domain_filter`)

For fine-grained row-level authorization (e.g. "Farmers can only see farms in their assigned region"):

```json
{
  "abac_rules": [
    {
      "role": "farmer",
      "model": "farm",
      "domain_filter": {
        "field": "region_id",
        "operator": "=",
        "value_source": "user_property.region_id"
      }
    }
  ]
}
```

To prevent SQL injection via domain filter operators, the Security Engine strictly validates `operator` against a compiled whitelist enum before building parameterized SQL clauses:

```python
ALLOWED_OPERATORS = {"=", "!=", ">", ">=", "<", "<=", "in", "not_in", "is_null", "is_not_null"}

def compile_domain_filter(domain_filter: dict) -> str:
    op = domain_filter["operator"]
    if op not in ALLOWED_OPERATORS:
        raise SecurityEngineError(f"Disallowed operator in domain filter: {op}")
    field = assert_safe_identifier(domain_filter["field"], "domain_filter field")
    # Build parameterized clause; never string-interpolate value_source directly
    return f"{field} {op} :value_param"
```

When a user with `farmer` role queries `/api/data/farm`, the Security Engine inspects `role_record_rule` and automatically appends `AND region_id = :user_region_id` to the SQL query.

---

## 8.4 Encrypted Secrets Vault (`sys_secret` & `secrets/schema.json`)

Modules declare required external API credentials in `secrets/schema.json`:

```json
{
  "required_secrets": [
    { "key": "STRIPE_API_KEY", "description": "Stripe secret key for payment capture" }
  ]
}
```

- Values are entered by the tenant admin in the platform vault UI at install time.
- Stored envelope-encrypted via KMS in `sys_secret` (`id`, `account_id`, `module_name`, `key_name`, `encrypted_value`).
- Accessible inside process sandboxes exclusively via SDK call `get_secret(key)`. Module code never sees KMS keys or raw ciphertext on disk.

---

## 8.5 Always-On Audit Emitter & `sys_audit_log` System Table

Audit logging is enforced as an always-on system emitter across all engines:
1. System Table `sys_audit_log`: (`id`, `account_id`, `event_type`, `module_name`, `user_id`, `details_json`, `created_at`).
2. Installation Pipeline: Emitters fire at every stage boundary (`install.started`, `install.stage_complete`, `install.completed`, `install.failed`).
3. Runtime & Access Enforcement: Emitters record every ABAC allow/deny decision, every cross-module `call_integration` invocation (caller, callee, duration; excluding payloads to protect secrets), and every lifecycle hook execution status.
4. SDK Emitter: Hooks invoke `emit_audit_log(event_type, payload)` for custom operational telemetry.

---

## 8.4 Security Engine Role Seeding Logic

```python
import os
import json
import uuid
from typing import List, Any

class SecurityEngine:
    def __init__(self, db_session):
        self.db = db_session

    def seed_defaults(self, module, account_id: str, sys_models: List[Any]):
        sec_file = os.path.join(module.directory, "security", "access.json")
        if not os.path.exists(sec_file):
            return

        with open(sec_file, "r", encoding="utf-8") as f:
            sec_data = json.load(f)

        roles_dict = sec_data.get("roles", {})
        sys_model_map = {m.name: m for m in sys_models}

        for role_key, role_spec in roles_dict.items():
            role_row = self._upsert_role(account_id, role_key, role_spec)

            # Model access permissions
            model_access = role_spec.get("model_access", {})
            for model_name, perms in model_access.items():
                if model_name in sys_model_map:
                    sys_m = sys_model_map[model_name]
                    self._upsert_model_access(role_row.id, sys_m.id, perms)

    def _upsert_role(self, account_id, role_key, spec):
        from models.rbac import Role
        r = self.db.query(Role).filter(Role.account_id == account_id, Role.name == role_key).first()
        if not r:
            r = Role(
                id=str(uuid.uuid4()),
                account_id=account_id,
                name=role_key,
                can_install_modules=spec.get("can_install_modules", False)
            )
            self.db.add(r)
            self.db.flush()
        return r

    def _upsert_model_access(self, role_id, model_id, perms):
        from models.rbac import RoleModelAccess
        rma = self.db.query(RoleModelAccess).filter(
            RoleModelAccess.role_id == role_id,
            RoleModelAccess.model_id == model_id
        ).first()

        if not rma:
            rma = RoleModelAccess(
                role_id=role_id,
                model_id=model_id,
                can_create=perms.get("create", False),
                can_read=perms.get("read", False),
                can_write=perms.get("update", False),
                can_delete=perms.get("delete", False)
            )
            self.db.add(rma)
```

---

## Command Line Security Matrix Inspection Code

```powershell
# Command line to view security access JSON files across modules
Get-ChildItem -Path "modules" -Filter "access.json" -Recurse | Select-Object FullName
```
