# 16. Architecture & Security Critique: Gap Analysis & Resolution Matrix

*A review of this guide's architecture, installer engine, and security model, benchmarked against production plugin ecosystems (vTiger, Frappe/ERPNext), detailing the resolution of all identified architectural gaps.*

---

## 16.1 What's Solid in UNIVA Architecture

- **Declarative-only modules** (no arbitrary backend code shipped in a module) is the right call for a multi-tenant SaaS. It's the same philosophy Frappe uses with its "app" fixtures/hooks system, just pushed further toward pure JSON.
- **SQL identifier whitelisting** (`^[a-z0-9_]{1,63}$`) enforced before any DDL string interpolation is correct, preventing SQL injection attacks at the schema level.
- **Two-phase FK resolution** (create relation columns as plain UUIDs first, apply FK constraints after all modules are loaded) solves a real, non-obvious ordering problem.
- **Transactional install with concurrency locking and rollback** ensures multi-tenant atomicity (`install:{account_id}:{module_name}`).
- **RBAC + ABAC split** (`role_model_access`, `role_field_access`, `role_record_rule`) provides granular record-level and field-level permissions.

---

## 16.2 Resolution Breakdown of the 10 Core Architectural Gaps

All 10 priority gaps identified during initial architectural auditing have been **100% Closed and Integrated into the UNIVA Core Engine Specification**:

1. **Module Provenance & Signature Verification (✅ RESOLVED)**:
   - *Fix*: Integrated `ProvenanceEngine.verify(module_package)` into Stage -2 of the installer. Recomputes SHA-256 hash of module tarball, compares against `provenance.package_sha256`, and verifies Ed25519 `provenance.signature` against `signing_key_id` using a trusted-publisher keyring. Unsigned modules require explicit org-level admin toggle.
2. **Install-Time Permission & Consent Surface (✅ RESOLVED)**:
   - *Fix*: Mechanically derives scope lists from manifest data (`models`, `requires_integration`, `default_roles`/`features`, `hooks`, `secrets`, publisher ID) and presents an OAuth-style consent screen to the tenant administrator prior to installation completion.
3. **`postMessage` Origin Security (✅ RESOLVED)**:
   - *Fix*: Enforced `window.HOST_ORIGIN` origin validation for all custom UI iframe widgets, eliminating wildcard `"*"` target origin vulnerabilities.
4. **Sandboxed Container Primitive for Hooks (✅ RESOLVED)**:
   - *Fix*: Specified gVisor (`runsc`) user-space kernel sandbox process isolation ceiling for lifecycle hooks, enforcing 5-second execution timeout and 128MB RAM memory limit with 4 allowlisted SDK calls.
5. **Always-On Audit Trail Emitter (✅ RESOLVED)**:
   - *Fix*: Implemented `emit_audit_log(event_type, module, account_id, metadata)` firing synchronously across all installation pipeline stages, runtime query executions, and integration function calls.
6. **Per-Tenant Resource Quotas (✅ RESOLVED)**:
   - *Fix*: Integrated Stage 0 `QuotaEngine.check(account_id, module)` verifying tenant limits (`max_tables_per_module`, `max_fields_per_model`, `max_storage_mb`, `max_hook_executions_per_minute`, `max_installed_modules`).
7. **ABAC Operator Whitelisting (✅ RESOLVED)**:
   - *Fix*: Enforced explicit `ALLOWED_OPERATORS` checking (`=`, `!=`, `>`, `<`, `>=`, `<=`, `IN`, `LIKE`) on `domain_filter.operator` strings before SQL query assembly.
8. **Encrypted Vault Secrets Management (✅ RESOLVED)**:
   - *Fix*: Added `secrets/schema.json` module contract. Secret keys are declared without values; values are collected via vault UI, stored envelope-encrypted in `sys_secret` via KMS, and accessed at runtime via SDK call `get_secret(key)`.
9. **Uninstall Data-Retention Policy (✅ RESOLVED)**:
   - *Fix*: Added declarative `uninstall_policy` in `manifest.json` supporting `archive` (30-day retention window), `drop_immediately`, and `retain_orphaned`.
10. **Platform Version Compatibility Gate (✅ RESOLVED)**:
    - *Fix*: Integrated Stage -1 `requires_platform_version` SemVer check using `semver_satisfies()`, aborting installation before any DDL or filesystem changes occur if incompatible.

---

## 16.3 Architectural Resolution Matrix

| Priority | Identified Gap | Resolution Status | Engine / Fix Mechanism |
|---|---|---|---|
| 1 | `postMessage("*")` origin bug | ✅ **CLOSED** | Enforced `window.HOST_ORIGIN` event origin checking in custom widget assets |
| 2 | `domain_filter.operator` whitelist | ✅ **CLOSED** | Parameterized `ALLOWED_OPERATORS` validator in Engine 4 (Security) |
| 3 | Module provenance/signing | ✅ **CLOSED** | `ProvenanceEngine.verify()` Stage -2 SHA-256 + Ed25519 signature verification |
| 4 | Named sandbox mechanism for hooks | ✅ **CLOSED** | gVisor (`runsc`) process container with 5s / 128MB resource limits |
| 5 | Runtime audit trail | ✅ **CLOSED** | Always-on `emit_audit_log()` emitter across install, query & integration flows |
| 6 | Per-tenant resource quotas | ✅ **CLOSED** | `QuotaEngine.check()` in Stage 0 verifying account platform quota caps |
| 7 | Install-time permission/consent screen | ✅ **CLOSED** | Mechanically derived scope confirmation surface before install completion |
| 8 | Secrets management channel | ✅ **CLOSED** | KMS envelope-encrypted `sys_secret` vault via `secrets/schema.json` |
| 9 | Uninstall data-retention policy | ✅ **CLOSED** | Declarative `uninstall_policy` (`archive`, `drop_immediately`, `retain_orphaned`) |
| 10 | Platform version compatibility gate | ✅ **CLOSED** | Stage -1 `requires_platform_version` SemVer check via `semver_satisfies()` |

---

## 17. Installer Engine Bugs & Lifecycle Completeness — Resolution Status

- **Foreign key failures handling (✅ RESOLVED)**: Failed FK constraints trigger complete transaction `ROLLBACK` and release lock; never swallowed silently.
- **Exposed-function schema type validation (✅ RESOLVED)**: `FunctionRegistry` validates input/output field types against strict JSON schemas.
- **Exposed function execution sandbox (✅ RESOLVED)**: Cross-module function calls execute within bounded resource limits with audit logging.
- **Successful install audit logging (✅ RESOLVED)**: Every completed stage and successful install emits `emit_audit_log("install.completed")`.
- **Cache invalidation safety (✅ RESOLVED)**: Permission and model registry caches invalidate inside transactional `finally` blocks post-commit.
- **Lifecycle completeness (✅ RESOLVED)**: Fully specified `uninstall` compensating workflow and `migrations/*.json` upgrade runner.
- **Installed-module state table (✅ RESOLVED)**: Fully specified `sys_installed_module` catalog table schema.

---

## 18. Runtime Access Enforcement (`chokepoint.py`)

Every runtime call to `/api/data/*` passes through the central enforcement chokepoint:
1. Resolve calling user role for tenant account.
2. Verify `role_model_access` for CRUD permission.
3. Apply `role_field_access` column allow-lists for read/write.
4. Append `role_record_rule` `domain_filter` SQL conditions alongside `account_id`.
5. Execute query safely with runtime audit logging.

---

## 19. Platform Permission Catalog Model

- **Modules declare permission points, never roles**: `security/access.json` acts as a permission catalog file declaring models, fields, and features.
- **Engine 4 registers permission points into platform catalog**: The host platform's role system assigns users to roles, resolving authority conflicts and role-name collisions.

---

## Command Line Verification Code

```powershell
# Command line to build documentation site after gap analysis update
cd d:\Work\UNIVA\PLUGIN-MODULE-SYSTEM\mkdoc
npm run docs:build
```
