# Managing Sites

Sites represent the websites or domains that will send form submissions to Can-O-Forms. Each site has its own API key and can contain multiple forms.

## Overview

A **Site** is an organizational unit that:
- Groups related forms together
- Provides a unique API key for authentication
- Configures domain-based origin validation
- Isolates forms from other sites

**Use cases:**
- Organize forms by website (e.g., "Main Site", "Blog", "Client Site")
- Separate forms for different domains
- Manage multiple client websites from one account

## Creating a Site

1. Navigate to **Settings** → **Sites** in the sidebar
2. Fill in the site details:
   - **Name**: A friendly name for your site (e.g., "My Portfolio", "Client Website")
   - **Domain**: The canonical domain of your site (e.g., `example.com`)
3. Click **Create Site**

Your site will be created with a unique API key automatically generated.

### Site Name

The site name is a friendly identifier used in the admin dashboard:
- Helps you organize and identify sites
- Displayed in site lists and form editors
- Can be any descriptive text

**Examples:**
- "My Personal Site"
- "Client: Acme Corp"
- "Blog Site"
- "Portfolio Website"

### Domain Configuration

The domain is used for **origin validation** to prevent unauthorized submissions:

**Format:**
- Don't include `http://` or `https://`
- Don't include trailing slashes
- Include subdomain if needed (e.g., `blog.example.com`)

**Examples:**
- ✅ `example.com`
- ✅ `www.example.com`
- ✅ `blog.example.com`
- ✅ `subdomain.example.com`
- ❌ `https://example.com` (includes protocol)
- ❌ `example.com/` (includes trailing slash)

**Important**: The domain must match your actual website domain for origin validation to work. See [Origin Validation](#origin-validation) for details.

## Site Details

### API Key

Each site has a **unique API key** that:
- Is automatically generated when the site is created (UUID format)
- Is used in form submission URLs
- Identifies which site a form belongs to
- Is required for all API requests

**Finding your API key:**
1. Go to **Settings** → **Sites**
2. Find your site in the list
3. Copy the API key (click the copy button)

**API key format:**
- UUID format (e.g., `abc123-def456-ghi789-jkl012`)
- Unique per site
- Never changes (even if you could edit the site)

**Security note**: API keys are visible in HTML source code and network requests. This is acceptable because:
- Rate limiting prevents abuse
- Origin validation prevents unauthorized use
- API keys only allow form submissions (not data access)

### Domain

The domain controls **origin validation** for all forms on the site:

- **Exact match**: `https://example.com` matches `example.com`
- **www variants**: `https://www.example.com` matches `example.com`
- **Subdomains**: `https://blog.example.com` matches `example.com`
- **Localhost**: Automatically allowed for development

**Changing the domain:**
- Currently, sites cannot be edited after creation
- If you need to change the domain, create a new site and move forms to it
- Or delete and recreate the site (warning: this deletes all forms)

## Viewing Sites

Navigate to **Settings** → **Sites** to see:
- **Name** - Friendly site identifier
- **Domain** - Configured domain for origin validation
- **API Key** - Unique identifier (with copy button)
- **Forms** - Number of forms on this site

## Moving Forms Between Sites

You can move forms from one site to another:

1. Go to the form's edit page
2. Use the **Site** dropdown in the form header
3. Select the destination site
4. The form is automatically moved

**What happens:**
- Form is associated with the new site
- Form slug must be unique within the new site
- API endpoint changes (uses new site's API key)
- All submissions remain associated with the form

**Note**: If the form slug conflicts with an existing form on the destination site, the move will fail. Ensure unique slugs.

## Deleting a Site

1. Navigate to **Settings** → **Sites**
2. Find the site you want to delete
3. Click **Delete** (if available in the UI)
4. Confirm the deletion

**Warning**: Deleting a site will permanently delete:
- All forms on the site
- All fields for those forms
- All submissions for those forms

**This action cannot be undone.**

**Note**: Currently, site deletion may not be available in the UI. If needed, contact support or use database operations.

## Origin Validation

The site's domain is used to validate that form submissions come from authorized domains.

### How It Works

1. **Submission received**: Form submission includes `Origin` header
2. **Domain check**: Origin is validated against site's configured domain
3. **Matching rules**: Flexible matching (exact, www, subdomains)
4. **Rejection**: Unauthorized origins are rejected with `403` error

### Matching Rules

Site domain: `example.com`
- ✅ `https://example.com` (exact match)
- ✅ `https://www.example.com` (www variant)
- ✅ `https://blog.example.com` (subdomain)
- ✅ `https://cdn.example.com` (subdomain)
- ✅ `http://localhost` (development)
- ❌ `https://other-site.com` (unauthorized)

See [Security & Privacy](./security.md) for detailed origin validation documentation.

## Multiple Sites

You can create multiple sites to organize your forms:

**Use cases:**
- **Multiple websites**: One site per domain
- **Client separation**: Separate sites for different clients
- **Environment separation**: Different sites for staging/production
- **Organization**: Group related forms together

**Benefits:**
- Better organization
- Separate API keys per site
- Independent domain configuration
- Clear separation of forms

## API Key Usage

The site API key is used in:

1. **Embed script**:
   ```html
   <div data-site-key="YOUR_API_KEY" data-can-o-form="contact"></div>
   ```

2. **Manual submit API**:
   ```
   POST /api/submit/{siteApiKey}/{formSlug}
   ```

3. **Embed API**:
   ```
   GET /api/embed/{siteApiKey}/{formSlug}
   POST /api/embed/{siteApiKey}/{formSlug}
   ```

**Important**: The API key must match the site that owns the form. Forms cannot be submitted using a different site's API key.

## Best Practices

1. **Use descriptive names**: Choose clear site names for easy identification
2. **Configure domains correctly**: Set accurate domains for origin validation
3. **One site per domain**: Create separate sites for different domains
4. **Keep API keys secure**: While visible in code, don't share unnecessarily
5. **Test origin validation**: Verify submissions work from your domain
6. **Organize logically**: Group related forms on the same site

## Troubleshooting

### "Origin not allowed" Error

**Check:**
- Does your site's domain match your actual website domain?
- Is the domain configured correctly (no `http://`, no trailing slashes)?

**Solution:**
- Update the site domain to match exactly
- For local testing, set domain to `localhost`
- Verify subdomain configuration if using subdomains

### API Key Not Working

**Check:**
- Is the API key correct?
- Does the form belong to the site with this API key?
- Is the form slug correct?

**Solution:**
- Verify API key in site settings
- Check that form is on the correct site
- Ensure form slug matches

### Can't Move Form to Another Site

**Check:**
- Does the destination site exist?
- Does the form slug conflict with existing form on destination site?

**Solution:**
- Verify destination site exists
- Rename form slug if it conflicts
- Ensure you own both sites

### Site Not Appearing in List

**Check:**
- Are you logged in?
- Does the site belong to your account?

**Solution:**
- Verify you're logged in
- Check account ownership
- Refresh the page

## Related Documentation

- [Forms](./forms.md) - Creating and managing forms
- [Integration Guide](./integration.md) - Using API keys in embeds
- [API Reference](./api.md) - API endpoint details
- [Security & Privacy](./security.md) - Origin validation and security
