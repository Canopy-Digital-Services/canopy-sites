# Can-O-Forms v2

A self-hosted forms backend with script-based embeds and form builder for static sites.

> **🤖 For AI Coding Assistants**: Read [`AGENT_CONTEXT.md`](./AGENT_CONTEXT.md) first to understand project architecture and avoid common mistakes.

## What is this?

Can-O-Forms is a lightweight, self-hosted alternative to services like Formspree or Google Forms. It provides:

- **Public submission API** for static sites (Astro, Figma Sites, etc.)
- **Admin UI** to manage sites, forms, and submissions
- **Email notifications** for new submissions
- **Spam protection** via honeypot fields and rate limiting
- **Multi-tenant architecture** supporting multiple sites per user
- **CSV export** for submissions
- **Origin validation** for security

Perfect for personal sites and client projects where you want full control over form data without relying on third-party services. Works great with Figma Sites, Astro, Next.js, and any static site generator.

## Features

### ✅ Core Features

#### v2 Features (Latest)
- [x] **Script-Based Embeds** - Single `<script>` tag form rendering
- [x] **Form Builder** - Define fields, validation, and order in admin UI
- [x] **Theme System** - Customize colors, fonts, spacing per form or embed
- [x] **Success Configuration** - Inline messages or redirect URLs
- [x] **Field Types** - Text, email, textarea, select, checkbox, hidden
- [x] **Client Validation** - Built-in required, email, length, regex validation
- [x] **Public Embed API** - Separate endpoints for form definitions

#### v1 Features (Stable)
- [x] **Multi-tenant Sites Management** - Manage multiple client sites from one dashboard
- [x] **Form Configuration** - Create and configure forms with custom notification emails
- [x] **Submission API** - Public POST endpoint for form submissions
- [x] **Email Notifications** - Automatic email alerts for new submissions (Nodemailer + SMTP)
- [x] **Spam Protection** - Honeypot fields and IP-based rate limiting
- [x] **Origin Validation** - CORS protection with domain whitelisting
- [x] **Admin Dashboard** - Clean, responsive UI for managing everything
- [x] **Submissions Management** - List, filter, view, and mark submissions
- [x] **CSV Export** - Download submissions as CSV files
- [x] **Authentication** - Secure admin access with NextAuth

### 🚀 Quick Example (v2 Embed)

Add a form to your website with just two lines of code:

```html
<div 
  data-can-o-form="contact"
  data-site-key="YOUR_API_KEY"
></div>
<script src="https://canoforms.canopyds.com/embed.js"></script>
```

**No manual HTML form writing required!** The embed script:
- Renders your form fields automatically (based on field builder configuration)
- Handles validation and submission
- Displays success messages or redirects
- Supports custom theming via `data-theme` attribute

**Customize appearance:**
```html
<div 
  data-can-o-form="contact"
  data-site-key="YOUR_API_KEY"
  data-theme='{"primary":"#0ea5e9","radius":8,"density":"comfortable"}'
></div>
<script src="https://canoforms.canopyds.com/embed.js"></script>
```

See [MIGRATION.md](./MIGRATION.md) for v1 to v2 upgrade guide, or [content/docs/integration.md](./content/docs/integration.md) for detailed integration instructions.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth v5 (credentials provider)
- **Email**: Nodemailer (SMTP)
- **UI**: Tailwind CSS + shadcn/ui components
- **Embed Script**: Vanilla JavaScript (no dependencies, built with esbuild)
- **Deployment**: Docker + Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- SMTP credentials (Migadu, SendGrid, etc.)

### Local Development

1. **Clone and install dependencies:**

```bash
git clone https://github.com/Skinnerbox916/Can-O-Forms.git
cd Can-O-Forms
npm install
```

2. **Set up environment variables:**

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/canoforms"

# NextAuth (required)
NEXTAUTH_SECRET="generate-random-secret-here"  # Use: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"  # Use https://yourdomain.com in production
AUTH_TRUST_HOST="true"  # Required when behind reverse proxy

# SMTP (optional, for email notifications)
SMTP_HOST="smtp.migadu.com"
SMTP_PORT="587"
SMTP_USER="your-email@yourdomain.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Can-O-Forms <noreply@yourdomain.com>"

# Admin user (optional, for seeding)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="changeme123"
```

**Important:** In production, set `NEXTAUTH_URL` to your public domain (e.g., `https://canoforms.canopyds.com`) and ensure `AUTH_TRUST_HOST="true"` is set.

3. **Generate Prisma Client:**

```bash
npm run db:generate
```

4. **Run database migrations:**

```bash
npm run db:migrate
```

5. **Seed initial admin user:**

```bash
npm run db:seed
```

6. **Build embed script:**

```bash
npm run embed:build
```

7. **Start development server:**

```bash
npm run dev
```

8. **Open http://localhost:3000** and log in with your admin credentials.

### Development Mode

For active development with hot reloading and Next.js error overlay:

```bash
# Start in development mode
docker compose -f docker-compose.dev.yml up -d --build

# View logs
docker logs -f canoforms
```

Development mode provides hot module replacement, error overlay, and source maps for better debugging.

## Deployment

### Docker Compose (Recommended)

```bash
# Start containers
docker compose up -d --build

# Run database migration (if needed)
docker compose exec canoforms npx prisma db push

# Seed admin user (if needed)
docker compose exec canoforms node -e "const bcrypt=require('bcrypt');const{PrismaClient}=require('@prisma/client');const{PrismaPg}=require('@prisma/adapter-pg');const{Pool}=require('pg');const pool=new Pool({connectionString:process.env.DATABASE_URL});const adapter=new PrismaPg(pool);const prisma=new PrismaClient({adapter});(async()=>{const hashed=await bcrypt.hash('admin123',10);const user=await prisma.user.upsert({where:{email:'admin@canopyds.com'},update:{password:hashed},create:{email:'admin@canopyds.com',password:hashed}});console.log('Admin user:',user.email);await prisma.\$disconnect();})();"
```

**Note:** The embed script is built automatically during Docker build. The container name is `canoforms` (not `can-o-forms`).

### Coolify / Other Platforms

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:
- Coolify setup
- Manual Docker deployment
- Reverse proxy configuration
- Database backups
- Security recommendations

## Development & Architecture

### Project Structure (v2 - Current)

```
can-o-forms/
├── embed/                # Embed script source (vanilla JS)
│   ├── src/
│   │   ├── index.ts     # Entry point, auto-init
│   │   ├── form.ts      # Form rendering & submission
│   │   ├── validation.ts # Client-side validation
│   │   ├── theme.ts     # Theme resolution & CSS vars
│   │   └── styles.ts    # Scoped CSS
│   └── esbuild.config.js # Build → public/embed.js
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Initial data seeding
├── public/
│   └── embed.js         # Built embed script (generated)
├── src/
│   ├── actions/
│   │   └── forms.ts     # Centralized form actions (create/update/delete)
│   ├── app/
│   │   ├── (auth)/      # Login pages
│   │   ├── (admin)/
│   │   │   ├── forms/[formId]/  # v2 form routes (no siteId)
│   │   │   │   ├── edit/        # Form editor
│   │   │   │   └── submissions/ # View submissions
│   │   │   └── settings/sites/  # Site management
│   │   └── api/
│   │       ├── embed/   # v2 embed API (GET/POST)
│   │       └── v1/      # v1 legacy API
│   ├── components/
│   │   ├── forms/       # Form editor components
│   │   │   ├── form-editor.tsx      # Main editor UI
│   │   │   ├── integrate-panel.tsx  # Embed code generator
│   │   │   ├── fields-section.tsx   # Field management section
│   │   │   ├── behavior-section.tsx # Success/redirect config
│   │   │   ├── appearance-section.tsx # Theme customization
│   │   │   └── preview-panel.tsx    # Live preview
│   │   ├── form-fields-manager.tsx  # Field CRUD logic
│   │   ├── field-list.tsx           # Draggable field list
│   │   ├── field-editor-modal.tsx   # Field creation/editing
│   │   └── ui/          # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts      # NextAuth configuration
│   │   ├── db.ts        # Prisma client
│   │   ├── data-access/forms.ts # Form data helpers
│   │   ├── email.ts     # Email service
│   │   └── validation.ts # Origin validation
│   └── types/           # TypeScript types
├── Dockerfile           # Production Docker build
├── docker-compose.yml   # Deployment configuration
└── AGENT_CONTEXT.md     # AI coding assistant guide
```

### Architecture Decisions

**v2 Route Structure**: Forms are accessed directly via `/forms/[formId]` (no `siteId` in URL). Ownership is verified through the Form → Site → User relationship chain.

**Server Components First**: Pages are server components by default. They fetch data and pass runtime configuration (like `apiUrl`) to client components as props.

**Centralized Actions**: All mutations go through `src/actions/forms.ts`. These actions enforce ownership internally and revalidate affected routes.

**Component Hierarchy**:
```
page.tsx (server) 
  └─ FormEditor (client)
       ├─ FieldsSection (client)
       │   └─ FormFieldsManager (client)
       │       └─ FieldList + FieldEditorModal
       ├─ BehaviorSection (client)
       ├─ AppearanceSection (client)
       └─ IntegratePanel / PreviewPanel (client)
```

### Key Configuration: `NEXT_PUBLIC_APP_URL`

**Problem**: Client components can't access runtime environment variables. `process.env.NEXT_PUBLIC_APP_URL` is baked in at build time.

**Solution**: Server components read env vars at runtime and pass them as props to client components.

Example:
```typescript
// page.tsx (server component)
export default async function FormEditPage() {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3006";
  return <FormEditor apiUrl={apiUrl} form={form} />;
}

// form-editor.tsx (client component)
export function FormEditor({ apiUrl, form }: FormEditorProps) {
  // Use apiUrl prop, not process.env
}
```

### Building the Embed Script

The embed script must be rebuilt after changes:

```bash
npm run embed:build  # Compiles embed/src/ → public/embed.js
```

For Docker deployment, this happens automatically during `docker compose build`.

### Docker Deployment

The `Dockerfile` uses a multi-stage build:
1. **deps**: Install npm dependencies
2. **builder**: Build embed script → Generate Prisma Client → Build Next.js app
3. **runner**: Copy artifacts and run production server

`NEXT_PUBLIC_APP_URL` is passed as a build argument:

```yaml
# docker-compose.yml
build:
  context: .
  args:
    NEXT_PUBLIC_APP_URL: "https://canoforms.canopyds.com"
```

To rebuild and deploy:
```bash
docker compose down
docker compose build --no-cache  # Force rebuild with new env vars
docker compose up -d
```

## API Documentation

### v2 Embed API (Recommended)

Used by the embed script. You typically don't need to call these directly.

**Get Form Definition:**
```
GET /api/embed/{siteApiKey}/{formSlug}
```

Returns embed-safe form definition:
- Field definitions with validation rules
- Theme defaults
- Success behavior (message or redirect URL)

**Submit Form:**
```
POST /api/embed/{siteApiKey}/{formSlug}
Content-Type: application/json

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
  "id": "submission-id"
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

### v1 API (Legacy, Still Supported)

For manual HTML form integrations:

```
POST /api/v1/submit/{siteApiKey}/{formSlug}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!"
}
```

**Error Responses:**
- `403` - Origin not allowed
- `404` - Site or form not found
- `429` - Rate limit exceeded

**Full API documentation:** See [content/docs/api.md](./content/docs/api.md)  
**Integration guide:** See [content/docs/integration.md](./content/docs/integration.md)  
**Migration guide:** See [MIGRATION.md](./MIGRATION.md)

## Features Roadmap

### v2 Complete ✅
- Script-based embeds (single `<script>` tag)
- Form builder with field management
- Field types: Text, Email, Textarea, Select, Checkbox, Hidden
- Client and server-side validation
- Theme system with customization
- Success messages and redirect URLs
- Public embed API endpoints
- Figma Sites compatibility

### v3+ Planned
- Drag-and-drop field builder
- Visual theme editor
- Conditional field logic
- File uploads
- Webhooks
- Real-time form preview
- Multi-page forms
- Analytics dashboard
- Iframe embed URL support

See [V2_IMPLEMENTATION.md](./V2_IMPLEMENTATION.md) for implementation details and [PRD v2.md](./PRD%20v2.md) for the original requirements.

## Security Features

- **IP Hashing** - Never stores raw IP addresses (SHA-256 hashed)
- **Origin Validation** - CORS protection with domain whitelisting
- **Rate Limiting** - 10 submissions per IP per minute (POST), 60 requests per minute (GET)
- **Honeypot Fields** - Configurable spam trap fields
- **Secure Auth** - bcrypt password hashing, JWT sessions
- **No Public Signup** - Admin users created via seed script only
- **Field Validation** - Server-side validation against field schema (v2 forms)
- **Embed-Safe API** - Embed endpoints never expose admin data or sensitive information

## Contributing

This is a personal/client project, but issues and PRs are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Documentation

- **[Getting Started](./content/docs/index.md)** - Overview and key concepts
- **[Integration Guide](./content/docs/integration.md)** - How to add forms to your site
- **[Form Builder Guide](./content/docs/forms.md)** - Creating and managing forms
- **[API Reference](./content/docs/api.md)** - Complete API documentation
- **[Site Management](./content/docs/sites.md)** - Managing sites and API keys
- **[Submissions](./content/docs/submissions.md)** - Viewing and exporting submissions
- **[Migration Guide](./MIGRATION.md)** - Upgrading from v1 to v2
- **[Implementation Details](./V2_IMPLEMENTATION.md)** - Technical implementation notes

## Support

- **GitHub**: [Skinnerbox916/Can-O-Forms](https://github.com/Skinnerbox916/Can-O-Forms)
- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: All docs are in the `content/docs/` directory

---

Built with ❤️ by Skinnerbox916
