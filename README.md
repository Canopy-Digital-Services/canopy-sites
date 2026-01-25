# Can-O-Forms v3

A complete SaaS forms management platform with form builder UI, submission management, and script-based embeds for static sites.

> **🤖 For AI Coding Assistants**: Read [`AGENT_CONTEXT.md`](./AGENT_CONTEXT.md) first to understand project architecture and avoid common mistakes.

## Table of Contents

- [What This Is](#what-this-is)
- [Version History](#version-history)
- [Technology Stack](#technology-stack)
- [Local Development Setup](#local-development-setup)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Key Concepts](#key-concepts)
- [API Endpoints](#api-endpoints)
- [Development Workflows](#development-workflows)
- [Security Features](#security-features)
- [Current Status & Roadmap](#current-status--roadmap)

## What This Is

Can-O-Forms is a complete SaaS forms management platform that provides:

- **Form builder UI** - Create and edit forms with field management, validation, and theming
- **Admin interface** - Manage sites, forms, fields, and submissions through the web UI
- **Operator console** - Platform operator interface for account management with privacy-first design
- **Script-based embeds** - Single `<script>` tag to add forms to any static site
- **Submission management** - View, organize, and export form submissions (CSV and JSON)
- **Email notifications** - Automatic alerts for new submissions with per-form toggles
- **Multi-site support** - Manage forms for multiple client sites from one account
- **Account management** - Self-service signup, login, and password reset

**Platform URL**: https://canoforms.canopyds.com

**Status**: v3.0.0 - Production-ready platform with all planned features implemented

### Quick Example

Add a form to any website with just two lines:

```html
<div 
  data-can-o-form="contact"
  data-site-key="YOUR_API_KEY"
></div>
<!-- Note: data-api-key also works as an alternative to data-site-key -->
<script src="https://canoforms.canopyds.com/embed.js" defer></script>
```

The embed script automatically:
- Fetches form definition from your API
- Renders fields based on builder configuration
- Handles validation and submission
- Shows success messages or redirects
- Applies custom themes

## Version History

**Current Version:** v3.0.0 🎉

This project follows [Semantic Versioning](https://semver.org/) and maintains detailed documentation of changes:

- **[CHANGELOG.md](CHANGELOG.md)** - Concise version history with key changes per release
- **[docs/epics/](docs/epics/)** - Detailed completion reports for each epic with implementation details, technical decisions, and verification steps

**v3.0.0** (2026-01-24) - 🎉 **Complete Platform Release**
- All 7 planned epics implemented
- Admin Console (Epic 6) - Operator-only interface with hybrid delete and metadata-only views
- Production-ready SaaS platform

Previous releases:
- **v2.6.0** (2026-01-24) - Submission Review & Export (Epic 5) - JSON export support
- **v2.5.0** (2026-01-24) - Submission Events & Email Notifications (Epic 4) - Per-form notification toggles
- **v2.4.0** (2026-01-24) - Submission Ingestion (Epic 3) - Payload size limits for robust ingestion
- **v2.3.0** (2026-01-24) - Form Ownership & Metadata (Epic 2) - Direct account-based ownership
- **v2.2.0** (2026-01-24) - Account & Authentication (Epic 1) - Self-service signup and password reset
- **v2.1.0** (2026-01-24) - Email Infrastructure (Epic 0)
- **v2.0.0** - Base v2 platform with multi-tenant support and embed system

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth v5 (credentials provider) with self-service signup and password reset
- **Email**: Nodemailer (SMTP) for notifications and password resets
- **UI**: Tailwind CSS + shadcn/ui components
- **Embed Script**: Vanilla JavaScript (no dependencies, built with esbuild)
- **Development**: Docker + Docker Compose

## Local Development Setup

### Prerequisites

- Docker and Docker Compose
- SMTP credentials (optional for email testing)

### Environment Variables

Create a `.env` file in the project root:

```bash
# SMTP (optional for development)
SMTP_HOST="smtp.migadu.com"
SMTP_PORT="587"
SMTP_USER="your-email@yourdomain.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Can-O-Forms <noreply@yourdomain.com>"

# Admin user (for seeding)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="changeme123"
```

### Development Workflow

This project runs in Docker with PostgreSQL included:

```bash
# Start containers (first time)
docker compose up -d

# Make code changes, then rebuild
docker compose build && docker compose up -d

# View logs
docker logs canoforms -f

# Rebuild embed script (before docker compose build)
npm run embed:build

# Database commands
docker exec canoforms npm run db:migrate
docker exec canoforms npm run db:seed

# Stop containers
docker compose down
```

The app runs on port 3006 (mapped from container port 3000).

## Architecture Overview

### How Forms Work (v2)

1. **Admin creates form** in dashboard → Fields stored as database records
2. **Client embeds** script tag on their site with site API key
3. **Embed script** fetches form definition from `/api/embed/{key}/{slug}`
4. **User submits** → POST to same endpoint → stored in database → email queued
5. **Admin views** submissions in dashboard

### Route Structure

Forms are accessed directly via `/forms/[formId]` (no siteId in URL).

Ownership is verified through direct account relationship: **Form → Account** (v2.3.0+)

Legacy chain still exists: **Form → Site → User → Account**

### Component Architecture

```
page.tsx (server component)
  └─ FormEditor (client component, receives apiUrl as prop)
       ├─ FieldsSection
       │   └─ FormFieldsManager (handles field CRUD)
       │       └─ FieldList + FieldEditorModal
       ├─ BehaviorSection (success messages, redirects)
       ├─ AppearanceSection (theme customization)
       ├─ IntegratePanel (embed code generator)
       └─ PreviewPanel (live form preview)
```

### Key Architecture Decisions

**Server Components First**: Pages are server components by default. They fetch data and pass runtime configuration (like `apiUrl`) to client components as props.

**Why?** Client components get `NEXT_PUBLIC_APP_URL` baked in at build time. Server components can read env vars at runtime, so we pass values down as props.

```typescript
// page.tsx (server component)
export default async function FormEditPage() {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 process.env.NEXTAUTH_URL || 
                 "http://localhost:3006";
  return <FormEditor apiUrl={apiUrl} form={form} />;
}

// form-editor.tsx (client component)
export function FormEditor({ apiUrl, form }: FormEditorProps) {
  // Use apiUrl prop, not process.env
}
```

**Centralized Actions**: All mutations go through `src/actions/forms.ts`. These actions enforce ownership internally and revalidate affected routes.

## Project Structure

```
can-o-forms/
├── embed/                      # Embed script source
│   ├── src/
│   │   ├── index.ts            # Entry point, auto-init
│   │   ├── form.ts             # Form rendering & submission
│   │   ├── validation.ts       # Client-side validation
│   │   ├── theme.ts            # Theme resolution & CSS vars
│   │   └── styles.ts           # Scoped CSS
│   └── esbuild.config.js       # Build → public/embed.js
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Initial data seeding
├── public/
│   └── embed.js                # Built embed script (generated)
├── src/
│   ├── actions/
│   │   ├── auth.ts             # Auth actions (signup, password reset)
│   │   └── forms.ts            # Centralized form mutations
│   ├── app/
│   │   ├── (auth)/             # Auth pages (login, signup, password reset)
│   │   ├── (admin)/
│   │   │   ├── forms/[formId]/ # Form routes (no siteId)
│   │   │   │   ├── edit/       # Form editor
│   │   │   │   └── submissions/ # View submissions
│   │   │   │       └── export/ # CSV & JSON export route
│   │   │   ├── settings/sites/ # Site management
│   │   │   └── docs/           # Documentation viewer
│   │   └── api/
│   │       ├── embed/          # Embed API (GET/POST)
│   │       └── submit/         # Manual submit API (POST-only)
│   ├── components/
│   │   ├── forms/              # Form editor components
│   │   │   ├── form-editor.tsx       # Main editor UI
│   │   │   ├── integrate-panel.tsx   # Embed code generator
│   │   │   ├── fields-section.tsx    # Field management section
│   │   │   ├── behavior-section.tsx  # Success/redirect config
│   │   │   ├── appearance-section.tsx # Theme customization
│   │   │   ├── preview-panel.tsx     # Live preview
│   │   │   └── site-selector.tsx     # Site selection dropdown
│   │   ├── form-fields-manager.tsx   # Field CRUD logic
│   │   ├── field-list.tsx            # Draggable field list
│   │   ├── field-editor-modal.tsx    # Field creation/editing
│   │   ├── patterns/                 # Reusable UI patterns
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── auth-utils.ts       # Auth helper functions
│   │   ├── db.ts               # Prisma client
│   │   ├── data-access/        # Data access helpers
│   │   │   └── forms.ts
│   │   ├── email.ts            # Email service
│   │   ├── email-queue.ts      # Async email queue
│   │   ├── public-submit.ts    # Shared submit handler (used by embed & submit APIs)
│   │   ├── rate-limit.ts       # Rate limiting
│   │   └── validation.ts       # Origin validation
│   └── types/
│       └── next-auth.d.ts      # NextAuth type extensions
├── content/docs/               # Markdown documentation
├── Dockerfile                  # Docker build
├── docker-compose.yml          # Docker Compose config
├── docker-compose.dev.yml      # Development Docker Compose config
└── AGENT_CONTEXT.md            # AI coding assistant guide
```

## Key Concepts

### Database Schema

Fields are stored as **separate database records**, not JSONB:

```prisma
model Form {
  id                        String   @id
  siteId                    String
  accountId                 String    // ← Direct account ownership (v2.3.0+)
  createdByUserId           String    // ← Creator tracking (v2.3.0+)
  name                      String
  slug                      String
  notifyEmails              String[]
  emailNotificationsEnabled Boolean   // ← Per-form email toggle (v2.5.0+)
  honeypotField             String?
  successMessage            String?
  redirectUrl               String?
  defaultTheme              Json?
  
  site            Site
  account         Account   // ← Direct relation (v2.3.0+)
  createdByUser   User      // ← Creator relation (v2.3.0+)
  fields          Field[]   // ← Relational, not JSONB
  submissions     Submission[]
}

model Field {
  id          String    @id
  formId      String
  name        String
  type        FieldType  // TEXT, EMAIL, TEXTAREA, SELECT, CHECKBOX, HIDDEN
  label       String
  placeholder String?
  required    Boolean
  order       Int        // ← Explicit ordering
  options     Json?      // ← Only options/validation are JSONB
  validation  Json?
  
  form        Form
}
```

### Field Types

- **TEXT**: Single-line text input
- **EMAIL**: Email input with validation
- **TEXTAREA**: Multi-line text input
- **SELECT**: Dropdown with options
- **CHECKBOX**: Boolean checkbox
- **HIDDEN**: Hidden field (for tracking, UTM params, etc.)

### Field Validation

Each field can have validation rules stored in JSONB:

```json
{
  "minLength": 3,
  "maxLength": 100,
  "pattern": "^[A-Z]",
  "message": "Custom error message"
}
```

### Authentication & Accounts (v2.2.0+)

The platform uses **email + password authentication** with self-service signup:

- **Account Model**: Internal construct (one per user, not exposed in UI)
- **Self-Service Signup**: Users can register at `/signup` - account is created automatically
- **Password Reset**: Secure token-based reset flow via email (`/forgot-password` and `/reset-password`)
- **Login Telemetry**: Tracks `lastLoginAt`, `failedLoginCount`, `lastFailedLoginAt` for security monitoring
- **Security**: Generic error messages, bcrypt password hashing, cryptographically secure tokens

### Form Ownership & Metadata (v2.3.0+)

Forms and sites are directly owned by accounts:

- **Direct Account Ownership**: Forms have `accountId` foreign key to Account (no JOIN required)
- **Creator Tracking**: Forms track `createdByUserId` for attribution
- **Simplified Access Control**: Ownership checks use direct `accountId` comparison
- **Performance**: Faster queries without traversing Site → User → Account chain

```prisma
model Account {
  id        String   @id
  createdAt DateTime
  user      User?    // One-to-one relationship
  sites     Site[]   // Direct relation (v2.3.0+)
  forms     Form[]   // Direct relation (v2.3.0+)
}

model User {
  id                String    @id
  email             String    @unique
  password          String    // bcrypt hashed
  accountId         String    @unique
  lastLoginAt       DateTime?
  failedLoginCount  Int       @default(0)
  lastFailedLoginAt DateTime?
  
  account           Account
  sites             Site[]
  createdForms      Form[]    // Forms created by this user (v2.3.0+)
}

model Site {
  id        String   @id
  userId    String   // Legacy relation
  accountId String   // Direct ownership (v2.3.0+)
  // ...
  user      User
  account   Account  // Direct relation (v2.3.0+)
  forms     Form[]
}
```

Validation happens on both client (embed script) and server (API).

### Theme System

Forms have a default theme, embeds can override via `data-theme` attribute:

```html
<div 
  data-can-o-form="contact"
  data-site-key="YOUR_API_KEY"
  data-theme='{"primary":"#0ea5e9","radius":8,"density":"comfortable"}'
></div>
```

Themes control:
- **Typography:** Font family (dropdown with popular Google Fonts), font size
- **Colors:** Text, background, primary, border
- **Layout:** Border radius, spacing density (compact/normal/comfortable)
- **Submit Button:** Width (full/auto), alignment (left/center/right), custom text

### Success Behavior

Forms can either:
1. **Show inline message** (set `successMessage`)
2. **Redirect to URL** (set `redirectUrl`)

Configured in the Behavior section of the form editor.

## API Endpoints

### GET /api/embed/[siteApiKey]/[formSlug]

Fetch form definition for rendering.

**Response:**
```json
{
  "formId": "clx...",
  "slug": "contact",
  "fields": [
    {
      "id": "clx...",
      "name": "email",
      "type": "EMAIL",
      "label": "Email Address",
      "placeholder": "you@example.com",
      "required": true,
      "validation": {"message": "Please enter a valid email"}
    }
  ],
  "successMessage": "Thanks for contacting us!",
  "redirectUrl": null,
  "defaultTheme": {"primary": "#3b82f6", "radius": 6}
}
```

### POST /api/embed/[siteApiKey]/[formSlug]

Submit form data.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!"
}
```

**Success Response:**
```json
{
  "success": true,
  "id": "clx..."
}
```

**Validation Error Response:**
```json
{
  "error": "Validation failed",
  "fields": {
    "email": "Email must be a valid email address.",
    "name": "Name is required."
  }
}
```

**Error Codes:**
- `400` - Validation failed
- `403` - Origin not allowed (CORS)
- `404` - Site or form not found
- `413` - Payload too large (exceeds 64KB limit)
- `429` - Rate limit exceeded

### Rate Limits & Payload Limits

- **GET requests**: 60 per minute per IP
- **POST requests**: 10 per minute per IP
- **Payload size**: 64KB maximum per submission

## Development Workflows

### Adding a New Field Type

1. Update `FieldType` enum in `prisma/schema.prisma`:
   ```prisma
   enum FieldType {
     TEXT
     EMAIL
     TEXTAREA
     SELECT
     CHECKBOX
     HIDDEN
     NUMBER  // ← New type
   }
   ```

2. Run migration:
   ```bash
   docker exec canoforms npm run db:migrate
   ```

3. Add validation logic in `embed/src/validation.ts`

4. Add rendering logic in `embed/src/form.ts`

5. Rebuild embed and Docker:
   ```bash
   npm run embed:build
   docker compose build && docker compose up -d
   ```

6. Update field editor modal in `src/components/field-editor-modal.tsx`

### Modifying Database Schema

```bash
# Create migration
docker exec canoforms npm run db:migrate

# Push changes without migration (dev only, faster for rapid iteration)
docker exec canoforms npm run db:push
```

### Testing Embed Changes

1. Make changes in `embed/src/`
2. Run `npm run embed:build`
3. Rebuild Docker: `docker compose build && docker compose up -d`
4. Hard refresh browser (Ctrl+Shift+R) to clear cached script
5. Test in form preview panel or on actual site

### Working with Environment Variables

**Problem**: Client components can't read runtime env vars.

**Solution**: Pass from server component props:

```typescript
// ✅ Correct (server component)
const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3006";
return <ClientComponent apiUrl={apiUrl} />;

// ❌ Wrong (client component)
const apiUrl = process.env.NEXT_PUBLIC_APP_URL; // Build-time only!
```

### Building the Embed Script

The embed script must be rebuilt after changes:

```bash
npm run embed:build  # Compiles embed/src/ → public/embed.js
```

The build process:
1. Bundles TypeScript with esbuild
2. Outputs single minified JS file
3. No external dependencies (fully self-contained)

## Security Features

- **IP Hashing** - Never stores raw IP addresses (SHA-256 hashed)
- **Origin Validation** - CORS protection with domain whitelisting
  - Exact domain match
  - Subdomain support (cdn.example.com matches example.com)
  - www variant handling
  - Localhost allowed for development
- **Rate Limiting** - IP-based with configurable windows
- **Payload Size Limits** - 64KB maximum submission size to prevent abuse (v2.4.0+)
- **Honeypot Fields** - Configurable spam trap fields
- **Secure Auth** - bcrypt password hashing, JWT sessions, self-service signup (v2.2.0+)
- **Password Reset** - Secure token-based reset with 1-hour expiration and single-use enforcement (v2.2.0+)
- **Field Validation** - Server-side validation against field schema
- **Embed-Safe API** - Public endpoints never expose admin data
- **Account Isolation** - Direct account-based ownership ensures complete data isolation (v2.3.0+)
- **Privacy-First Admin** - Operator console with metadata-only access, no content exposure (v3.0.0)

---

**Forms management platform for static sites** | [GitHub](https://github.com/Skinnerbox916/Can-O-Forms) | MIT License
