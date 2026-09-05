# 10. Lifecycle Event Hooks & Migrations (`hooks/` & `migrations/`)

## 10.1 Sandboxed Lifecycle Callbacks (`hooks/hooks.json`)

Lifecycle event hooks enable modules to execute custom setup logic when installed, upgraded, or uninstalled (e.g. seeding default master data or clearing cached resources).

To maintain platform stability, hooks do NOT run directly in the host server process. They run as sandboxed scripts declared in `hooks/hooks.json`:

**`modules/farms/hooks/hooks.json`**:
```json
{
  "on_install": "hooks.on_install",
  "on_uninstall": "hooks.on_uninstall"
}
```

---

## 10.2 Hook Execution Sandbox Specifications

Lifecycle hooks execute under strict process isolation enforced by the `LifecycleEngine` prior to execution:

- **Isolation Primitive**: gVisor (`runsc`) or Firecracker microVM container sandbox per hook invocation, destroyed immediately after execution (no reuse across installs or tenants).
- **Filesystem Boundaries**: Read-only root filesystem containing strictly the Python/Node interpreter + `univa_hooks_sdk`; zero host filesystem mounts allowed.
- **Network Namespace**: Isolated loopback interface connected exclusively to the host's local SDK RPC socket, which proxies allowlisted SDK calls (`call_integration`, `get_record`, `emit_audit_log`, `get_secret`). Direct network sockets are blocked at kernel boundaries.
- **Restricted SDK Allowlist**: Hooks can only invoke the 4 allowlisted SDK calls. Direct imports of host server modules or native OS bindings are forbidden.
- **Strict Resource Boundaries**: Hard timeout ceiling of **5.0 seconds** and memory ceiling of **128MB** per hook execution. Exceeding limits forcefully terminates the sandbox process.

---

## 10.3 Declarative Uninstall Workflow & Data-Retention Execution

When `uninstall_module(account_id, module_name)` is executed, the Lifecycle Engine processes table management according to `manifest.json`'s `uninstall_policy`:

1. `drop_immediately`: Physical SQL tables dropped as part of the uninstall transaction block.
2. `archive` (Default): Tables are renamed to `archived_<table_name>_<timestamp>`, marked unlinked in `sys_model`, and excluded from API query routes. A background cron job purges archived tables after `archive_after_days` (default 30 days).
3. `retain_orphaned`: Tables kept intact; `sys_model` row updated to `module_uninstalled = true` for manual export or admin cleanup.

---

## 10.4 Database Migration Engine (`migrations/<ver>_to_<ver>.json`) Schema & Execution

When upgrading an installed module to a newer version (e.g. `1.0.0` to `1.1.0`), the **Database Engine** executes declarative migration scripts (`migrations/1.0.0_to_1.1.0.json`):

**`modules/invoicing/migrations/1.0.0_to_1.1.0.json`**:
```json
{
  "from_version": "1.0.0",
  "to_version": "1.1.0",
  "operations": [
    {
      "type": "add_column",
      "model": "invoice",
      "field": {
        "name": "notes",
        "type": "string",
        "required": false,
        "label": "Invoice Notes"
      }
    }
  ]
}
```

Engine 2 executes `ALTER TABLE mod_invoicing_invoice ADD COLUMN notes TEXT NULL;` and registers `notes` in `sys_field`.

---

## Command Line Migration Check Code

```powershell
# Command line to check migration JSON schema files
Get-ChildItem -Path "modules" -Filter "*.json" -Recurse | Where-Object { $_.DirectoryName -like "*migrations*" }
```
