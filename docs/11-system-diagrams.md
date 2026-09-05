# 11. System Architecture & Data Flow (Mermaid Diagrams)

## 11.1 Module Installation Overview Diagram

```mermaid
graph TD
    Client["🌐 Dynamic UI Renderer"]
    Installer["⚡ UNIVA Installer Engine"]
    
    subgraph Installer Internal Engines
        E1["1️⃣ Manifest Engine"]
        E2["2️⃣ Database Engine"]
        E3["3️⃣ Integration Engine"]
        E4["4️⃣ Security Engine"]
        E5["5️⃣ UI Engine"]
        CK["🛡️ Data REST API / Chokepoint"]
    end
    
    subgraph Storage
        DB[("💾 Database System")]
        ModDir["📁 modules/ Directory"]
    end
    
    Client -->|1. POST /api/modules/:name/install| Installer
    Installer --> E1
    E1 -->|Load & Validate| ModDir
    E1 --> E2
    E2 -->|DDL CREATE TABLE & sys_model| DB
    E2 --> E3
    E3 -->|Attach FK Constraints| DB
    E3 --> E4
    E4 -->|Seed Roles & RBAC| DB
    E4 --> E5
    E5 -->|Register Views & Assets| DB
    Client -->|3. GET /api/modules/:name/views| E5
    Client -->|4. CRUD /api/data/:model_name| CK
    CK --> DB
```

---

## 11.2 Module Installation Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant User as 👤 Admin User
    participant Web as 🌐 sis_web (Port 5174)
    participant SIS as ⚡ sis_backend (Port 8001)
    participant E2 as 💾 DatabaseEngine
    participant E3 as 🔗 IntegrationEngine
    participant DB as 💾 SQLite (sis.db)

    User->>Web: Click "Install Module" (e.g. invoicing)
    Web->>SIS: POST /api/modules/invoicing/install
    SIS->>SIS: Verify JWT Token & Account Admin Role
    SIS->>E2: materialize_schema(invoicing)
    E2->>DB: CREATE TABLE mod_invoicing_invoice (...)
    E2->>DB: INSERT INTO sys_model & sys_field
    SIS->>E3: resolve_links(invoicing)
    E3->>DB: ALTER TABLE ... ADD CONSTRAINT fk_customer_id
    SIS->>DB: UPDATE account_module_install SET state='installed'
    SIS-->>Web: Return { success: true, message: "Installed successfully" }
    Web->>Web: Sidebar menu updates dynamically with "Invoicing"
```

---

## 11.3 Dynamic UI View Composition Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Web as 🌐 sis_web (Port 5174)
    participant SIS as ⚡ sis_backend (Port 8001)
    participant DB as 💾 SQLite (sis.db)

    Web->>SIS: GET /api/modules/invoicing/views
    SIS->>DB: Query sys_view for account_id & module invoicing
    DB-->>SIS: Return invoice_list.json & invoice_form.json
    SIS-->>Web: Return JSON View Schemas
    Web->>Web: DynamicModulePage.jsx renders Table + Columns + Actions
```

---

## 11.4 Cross-Module Integration Call Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Inv as 📦 invoicing Module
    participant Reg as 🛡️ FunctionRegistry
    participant Contacts as 📦 contacts_base Module

    Inv->>Reg: call("invoicing", "contacts_base", "get_contact", { contact_id: "..." })
    Reg->>Reg: Verify invoicing declared dependency in uses.json
    Reg->>Reg: Validate input_schema
    Reg->>Contacts: Dispatch to contacts_base.services.get_contact
    Contacts-->>Reg: Return { id: "...", display_name: "John Doe" }
    Reg->>Reg: Validate output_schema
    Reg-->>Inv: Return schema-validated contact payload
```

---

## Command Line Render Test Code

```powershell
# Command line to build docs site and verify mermaid syntax parsing
mkdocs build
```
