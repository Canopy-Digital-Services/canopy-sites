# Managing Sites

Sites represent the websites or domains that will send form submissions to Can-O-Forms. Each site has its own API key and can contain multiple forms.

## Creating a Site

1. Navigate to **Sites** in the sidebar
2. Click **New Site**
3. Fill in the site details:
   - **Name**: A friendly name for your site (e.g., "My Portfolio")
   - **Domain**: The canonical domain of your site (e.g., "example.com")
4. Click **Create Site**

Your site will be created with a unique API key automatically generated.

## Site Details

### API Key

The API key is used to authenticate form submissions. It's included in the submission URL and should be kept secure (though it will be visible in your HTML source).

**Example API Key**: `abc123-def456-ghi789`

### Domain

The domain is used for origin validation. Only form submissions from this domain (or subdomains) will be accepted. This prevents other sites from submitting forms to your account.

**Important**: 
- Don't include `http://` or `https://`
- Don't include trailing slashes
- Include subdomain if needed (e.g., "blog.example.com")

## Viewing Site Details

Click on a site name to view:
- Site information (name, domain, API key)
- List of all forms for this site
- Quick actions to edit or delete the site

## Editing a Site

1. Click on a site name
2. Click **Edit Site**
3. Update the name or domain
4. Click **Save Changes**

**Note**: Changing the domain will affect origin validation for all forms on this site.

## Deleting a Site

1. Click on a site name
2. Click **Delete Site**
3. Confirm the deletion

**Warning**: Deleting a site will permanently delete all associated forms and submissions. This action cannot be undone.

## Multiple Sites

You can create multiple sites if you manage several websites. Each site has its own API key and forms, keeping submissions organized and separate.
