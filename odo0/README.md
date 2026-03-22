# RevoraX — Product Lifecycle & Change Management

Multi-tenant **PLM** web app: **Products**, **Bills of Materials (BOM)**, and **Engineering Change Orders (ECO)** with approval workflow, versioning, audit trail, and role-based access.

---

## Table of contents

- [Core concepts](#core-concepts)
- [How Settings fits in the flow](#how-settings-fits-in-the-flow)
- [Roles](#roles)
- [Feature overview](#feature-overview)
- [End-to-end workflow](#end-to-end-workflow)
- [Repository layout](#repository-layout)
- [Environment](#environment)

---

## Core concepts

### Product

A sellable/manufactured item: **name**, **sale/cost price**, **attachments**, **version** (e.g. v1, v2), **Active** or **Archived**.  
Initial creation is allowed; **ongoing changes** go through an **ECO** (not direct edit).

### BOM (Bill of Materials)

The **recipe** for one product: **components** (which part + quantity) and **operations** (step name, time, work center).  
Has its own **version** and **Active/Archived** state. Same rule: **changes via ECO** after the initial BOM exists.

### ECO (Engineering Change Order)

A **formal change request**: what to change (product and/or BOM), **proposed fields**, **effective date**, and whether applying creates a **new version** or **patches in place**.  
ECOs move through **stages** (configured under **Settings**). Master data is updated only when an ECO reaches the **final stage** and an **admin** runs **Apply**.

---

## How Settings fits in the flow

**Settings** does **not** store product or BOM data. It configures **how every ECO moves** and **who may approve**:

| Tab | Purpose |
|-----|--------|
| **ECO Stages** | Ordered stages (e.g. **New → Approval → Done**). Each stage has **order**, **requires approval** (yes/no), and **is final** (last stage before **Apply**). |
| **Approval rules** | Maps a **stage name** → **which role** may approve/reject on that stage. If empty for a stage, **approver** and **admin** can still approve by default. |

**Default stages** (typical):

1. **New** — draft; engineering edits here; **Submit** moves to next stage.  
2. **Approval** — **Approver** (per rules) **Approves** or **Rejects**.  
3. **Done** — **final** stage; **Admin** runs **Apply** to write changes to Product/BOM.

New companies registered via the API receive these default stages automatically.

---

## Roles

| Role | Capabilities (summary) |
|------|-------------------------|
| **Engineering** | Create products & BOMs, create/edit ECO (first stage only), **Submit** ECO to next stage. |
| **Approver** | **Approve** or **Reject** ECOs on stages that **require approval**. |
| **Operations** | **Read-only** active products & BOMs (no ECO edits). |
| **Admin** | **Apply** ECO at final stage, archive product/BOM, **Members**, **Settings**, full **Reports**. |

---

## Feature overview

### Authentication & tenant

- JWT login; users scoped to a **company**.
- **Invite members** (admin): email + role; optional **invite email** if `GMAIL_*` / SMTP is set on the server (`server/.env`).

### Master data

- **Products**: list, detail, version history, archive (admin). Direct **PUT** updates are disabled; use **ECO** for changes.
- **BOMs**: list, detail, history, archive BOM (admin). Same ECO-only change rule.

### ECO module

- Create ECO (Product or BoM type), proposed changes, version-update flag, optional **ECO attachment URLs**.
- **Submit** (next stage), **Approve** / **Reject**, **Apply** (admin, final stage).
- **Comments** and **activity timeline** on ECO detail; **CSV export** for a snapshot.

### Settings (admin)

- CRUD **ECO stages**; manage **approval rules** by stage and role.

### Reports

- ECO summary, product/BOM version history, archived records, active product↔BOM matrix, **audit log** (filterable).

### Dashboards

- Role-specific home dashboards with KPI-style stats (open ECOs, pending approval, ready to apply, etc.).

### Audit & traceability

- Server-side audit entries for ECO lifecycle, applies, version creation, archives, and product/BOM updates driven by ECO.

---

## End-to-end workflow

1. **Settings** — configure stages + approval rules (once per company).  
2. **Create Product & BOM** (engineering).  
3. **Create ECO** with proposed changes.  
4. **Submit** → **Approve / Reject** → on **final stage**, **Admin Apply**.  
5. **Reports & Audit** — demonstrate traceability.

**Demo tip:** Use one **Product** price change ECO with **version update** on → after **Apply**, show **Version History** and **Audit Log**.

---

## Repository layout

| Path | Role |
|------|------|
| `client/` | React (Vite) SPA |
| `server/` | Express API, Mongoose models, JWT, mail |
| `server/.env.example` | Example variables (copy to `.env`) |

**Client API base:** `VITE_API_URL` or defaults to `/api` (proxied in dev).

**Server:** `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`; optional mail: `GMAIL_USER`, `GMAIL_APP_PASSWORD` (see `server/.env.example`).

---

## Environment

1. Copy `server/.env.example` → `server/.env` and fill values.  
2. Seed default ECO stages for the dev company (if needed): `cd server && npm run seed`  
3. **Server:** `cd server && npm install && npm run dev`  
4. **Client:** `cd client && npm install && npm run dev`

---

## License

Project for educational / hackathon use unless otherwise specified.
