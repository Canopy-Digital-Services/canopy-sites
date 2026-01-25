# v3 Product Brief

This document is a **lightweight PRD** intended primarily for **LLM context continuity**.

Its purpose is to:

* Establish shared understanding across chats and prompts
* Prevent rework or accidental scope expansion
* Anchor implementation decisions in explicit intent

This is **not** a marketing document and **not** a full requirements spec.

---

## Product Description

A **hosted SaaS forms platform with a full UI**.

Users create forms, receive submissions, and review/export data through the platform UI.

Forms may also accept submissions directly from custom frontends via HTTP POST ("white-box" usage).

The platform is built and operated by a single company for its own clients. It is not a general-purpose integration platform.

---

## Non-Goals

The following are explicitly **out of scope** for v3 unless stated otherwise:

* Teams or multi-user accounts
* Roles and permissions
* Billing or plans
* OAuth / SSO
* External integrations or automation platforms
* User-configurable webhooks
* Enterprise or compliance-heavy features beyond basic GDPR/CCPA alignment

---

## Existing State (v2 Assumptions)

* A working web UI already exists
* Users can already:

  * Create forms
  * Define fields and validation
  * Receive and view submissions
* Forms already have stable IDs and submission endpoints
* Submissions are already stored persistently

v3 work must **extend**, not replace, existing behavior.

---

## Core Concepts

### Account

* Internal construct
* Created automatically at signup
* Exactly one user per account in v3
* Not exposed directly in the UI

### User

* Authenticated via email + password
* Owns exactly one account

### Form

* Belongs to an account
* Defined via the UI
* Accepts submissions via HTTP POST

### Submission

* Created when data is POSTed to a form endpoint
* Stored and viewable in the UI

---

## Architectural Principles

* UI-first product (not headless-first)
* Privacy-first: operators/admins do not access user content
* Prefer explicit scope cuts over speculative extensibility
* Introduce seams (events, abstractions) only when immediately useful

---

## v3 Epics (High-Level)

### Epic 0 — Email Infrastructure

**Purpose:**
Provide basic outbound email capability required by the platform.

**Scope:**

* SMTP or email service integration
* Minimal email sending abstraction
* No templates system
* No marketing emails

**Used by:**

* Password reset (later epic)
* Submission notifications
* System emails

---

### Epic 1 — Account & Authentication

**Purpose:**
Introduce real authentication and internal account modeling.

**Scope:**

* Email + password signup and login
* Automatic account creation
* Auth state enforcement
* Basic login telemetry

---

### Epic 2 — Form Management Enhancements

**Purpose:**
Formalize form ownership, metadata, and settings under the account model introduced in v3.

**Scope:**

* Associate existing forms with accounts
* Ensure each form has a clear owner (`account_id`, `created_by_user_id`)
* Add or formalize basic form metadata (e.g., name, status)
* Ensure form access is properly auth-gated

**Explicitly out of scope:**

* Form templates
* Theming or styling
* Versioning
* Draft/publish workflows

---

### Epic 3 — Submission Ingestion (White-Box Support)

**Purpose:**
Ensure submissions can be reliably accepted from both hosted forms and fully custom frontends.

**Scope:**

* Public HTTP POST endpoint per form
* Accept JSON payloads from custom frontends
* Validate submissions against form schema
* Store submissions reliably
* Return clear success and error responses

**Explicitly out of scope:**

* Spam detection
* CAPTCHA
* Webhooks or external integrations
* Advanced rate limiting

---

### Epic 4 — Submission Events & Email Notifications

**Purpose:**
React internally to new submissions using email only.

**Scope:**

* Internal "submission created" event
* Email notification on submission receipt
* User-configurable toggle to enable/disable notifications
* Use email infrastructure from Epic 0

**Explicitly out of scope:**

* External webhooks
* Automation platforms
* Multiple recipients
* Custom email templates

---

### Epic 5 — Submission Review & Export

**Purpose:**
Allow users to view and retrieve their submission data.

**Scope:**

* View submissions per form in the UI
* Basic pagination or ordering
* Export submissions as:

  * CSV
  * JSON

**Explicitly out of scope:**

* Search
* Filtering
* Analytics or charts
* Data transformations

---

### Epic 6 — Admin Console

**Purpose:**
Allow the platform operator to manage accounts while preserving user data privacy.

**Scope:**

* Separate admin interface
* List accounts
* View account-level metadata only:

  * email
  * created_at
  * last_login_at
  * forms_count
  * submissions_count
* Delete accounts (hybrid delete)

**Explicitly out of scope:**

* Viewing form content
* Viewing submissions
* Impersonation
* Search or analytics

---

## Ordering Constraint

Epics are expected to be implemented in this order:

1. Epic 0 — Email Infrastructure
2. Epic 1 — Account & Authentication
3. Subsequent epics as needed

Later epics may assume earlier ones are complete.

---

## Prompting Guidance (For LLMs)

When working on this repository:

* Inspect existing code before designing new systems
* Do not recreate functionality that already exists
* Stay within the explicitly stated epic scope
* Avoid adding future-facing features unless explicitly instructed
* Prefer simple, direct solutions

If intent is unclear, **stop and ask rather than assume**.
