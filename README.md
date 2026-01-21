# Can-O-Forms v2

A self-hosted forms backend with script-based embeds and form builder for static sites.

## What is this?

Can-O-Forms is a lightweight, self-hosted alternative to services like Formspree or Google Forms. It provides:

- **Public submission API** for static sites (Astro, Figma Sites, etc.)
- **Admin UI** to manage sites, forms, and submissions
- **Email notifications** for new submissions
- **Spam protection** via honeypot fields and rate limiting
- **Multi-tenant architecture** supporting multiple sites per user
- **CSV export** for submissions
- **Origin validation** for security

Perfect for personal sites and client projects where you want full control over form data without relying on third-party services.

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

```html
<div 
  data-can-o-form="contact"
  data-site-api-key="YOUR_API_KEY"
  data-theme='{"primary":"#0ea5e9","radius":8}'
></div>
<script src="https://forms.yourdomain.com/embed.js"></script>
```

**No manual HTML form writing required!** The embed script:
- Renders your form fields automatically
- Handles validation and submission
- Displays success messages or redirects
- Supports custom theming

See [MIGRATION.md](./MIGRATION.md) for v1 to v2 upgrade guide.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth v5 (credentials provider)
- **Email**: Nodemailer (SMTP)
- **UI**: Tailwind CSS + shadcn/ui components
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

```bash
# Prisma will create .env on init, update these values:
DATABASE_URL="postgresql://user:password@localhost:5432/canoforms"
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

SMTP_HOST="smtp.migadu.com"
SMTP_PORT="587"
SMTP_USER="your-email@yourdomain.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Can-O-Forms <noreply@yourdomain.com>"

ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="changeme123"
```

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

## Deployment

### Docker Compose (Recommended)

```bash
docker-compose up -d
docker-compose exec can-o-forms npx prisma migrate deploy
docker-compose exec can-o-forms npm run db:seed
docker-compose exec can-o-forms npm run embed:build
```

### Coolify / Other Platforms

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:
- Coolify setup
- Manual Docker deployment
- Reverse proxy configuration
- Database backups
- Security recommendations

## Project Structure

```
can-o-forms/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts            # Initial data seeding
│   └── migrations/        # Database migrations
├── src/
│   ├── app/
│   │   ├── (auth)/       # Login pages
│   │   ├── (admin)/      # Admin dashboard
│   │   └── api/          # API routes (submission endpoint)
│   ├── components/
│   │   └── ui/           # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts       # NextAuth configuration
│   │   ├── db.ts         # Prisma client
│   │   ├── email.ts      # Email service
│   │   ├── validation.ts # Origin validation & IP hashing
│   │   └── rate-limit.ts # Rate limiting
│   └── types/            # TypeScript types
├── Dockerfile            # Production Docker build
├── docker-compose.yml    # Local dev stack
├── PRD.md               # Product requirements
└── DEPLOYMENT.md        # Deployment guide
```

## API Documentation

### v2 Embed API (Recommended)

**Get Form Definition:**
```
GET /api/embed/{siteApiKey}/{formSlug}
```

Returns form fields, validation rules, theme defaults, and success configuration.

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

Returns field-level validation errors or success.

### v1 API (Legacy, Still Supported)

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

See [MIGRATION.md](./MIGRATION.md) for details.

## Features Roadmap

### v2 Complete ✅
- Script-based embeds
- Form builder with field management
- Theme system
- Success messages/redirects

### v3+ Planned
- Drag-and-drop field builder
- Visual theme editor
- Conditional field logic
- File uploads
- Webhooks
- Real-time form preview
- Multi-page forms
- Analytics dashboard

See [V2_IMPLEMENTATION.md](./V2_IMPLEMENTATION.md) for implementation details.

## Security Features

- **IP Hashing** - Never stores raw IP addresses (SHA-256 hashed)
- **Origin Validation** - CORS protection with domain whitelisting
- **Rate Limiting** - 10 submissions per IP per minute
- **Honeypot Fields** - Configurable spam trap fields
- **Secure Auth** - bcrypt password hashing, JWT sessions
- **No Public Signup** - Admin users created via seed script only

## Contributing

This is a personal/client project, but issues and PRs are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- **GitHub**: [Skinnerbox916/Can-O-Forms](https://github.com/Skinnerbox916/Can-O-Forms)
- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: See [PRD.md](./PRD.md) for detailed requirements

---

Built with ❤️ by Skinnerbox916
