# Can-O-Forms

A self-hosted forms backend with minimal admin UI for static sites.

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

### ✅ Core Features (MVP Complete)

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
- [x] **Integration Helper** - Copy-paste code examples for easy integration

### 🚀 Quick Example

```html
<form id="contact-form">
  <input type="text" name="name" required>
  <input type="email" name="email" required>
  <textarea name="message" required></textarea>
  <button type="submit">Send</button>
</form>

<script>
document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  const response = await fetch('https://forms.yourdomain.com/api/v1/submit/{API_KEY}/{FORM_SLUG}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (response.ok) {
    alert('Form submitted successfully!');
    e.target.reset();
  }
});
</script>
```

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

6. **Start development server:**

```bash
npm run dev
```

7. **Open http://localhost:3000** and log in with your admin credentials.

## Deployment

### Docker Compose (Recommended)

```bash
docker-compose up -d
docker-compose exec can-o-forms npx prisma migrate deploy
docker-compose exec can-o-forms npm run db:seed
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

### Submit Form

```
POST /api/v1/submit/{siteApiKey}/{formSlug}
Content-Type: application/json
Origin: https://yourdomain.com

{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!"
}
```

**Response:**

```json
{
  "success": true,
  "id": "submission-id"
}
```

**Error Responses:**
- `403` - Origin not allowed
- `404` - Site or form not found
- `429` - Rate limit exceeded

## Features Roadmap

### Not Included in MVP (Future Considerations)

- Form builder UI
- File uploads
- Webhooks
- Custom success pages
- OAuth providers
- Analytics dashboard
- Team accounts
- Billing/plans

These features may be added later without breaking the core architecture.

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
