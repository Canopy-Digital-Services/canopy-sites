# Integrating Forms with Your Static Site

Learn how to integrate Can-O-Forms with your static website using HTML forms or JavaScript.

## Prerequisites

Before integrating, make sure you have:
1. Created a site in Can-O-Forms
2. Created a form with a unique slug
3. Your site's API key
4. The Can-O-Forms API endpoint URL

## API Endpoint Format

```
POST https://your-canoforms-domain.com/api/v1/submit/{siteApiKey}/{formSlug}
```

Replace:
- `your-canoforms-domain.com` - Your Can-O-Forms instance domain
- `{siteApiKey}` - Your site's API key
- `{formSlug}` - Your form's slug

## HTML Form Integration

The simplest integration is a standard HTML form:

```html
<form
  action="https://your-canoforms-domain.com/api/v1/submit/YOUR_API_KEY/contact"
  method="POST"
>
  <input type="text" name="name" placeholder="Your Name" required />
  <input type="email" name="email" placeholder="Your Email" required />
  <textarea name="message" placeholder="Your Message" required></textarea>
  
  <!-- Honeypot field (hidden from users) -->
  <input type="text" name="website" style="display: none;" />
  
  <button type="submit">Send Message</button>
</form>
```

**Note**: This will cause a page redirect after submission. For a better user experience, use JavaScript/AJAX.

## JavaScript/Fetch API Integration

For a modern, AJAX-based submission with custom success/error handling:

```html
<form id="contactForm">
  <input type="text" name="name" placeholder="Your Name" required />
  <input type="email" name="email" placeholder="Your Email" required />
  <textarea name="message" placeholder="Your Message" required></textarea>
  <input type="text" name="website" style="display: none;" />
  <button type="submit">Send Message</button>
</form>

<div id="formStatus"></div>

<script>
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  const statusDiv = document.getElementById('formStatus');
  statusDiv.textContent = 'Sending...';
  
  try {
    const response = await fetch(
      'https://your-canoforms-domain.com/api/v1/submit/YOUR_API_KEY/contact',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    
    if (response.ok) {
      statusDiv.textContent = 'Thank you! Your message has been sent.';
      statusDiv.style.color = 'green';
      form.reset();
    } else {
      const error = await response.json();
      statusDiv.textContent = `Error: ${error.error || 'Submission failed'}`;
      statusDiv.style.color = 'red';
    }
  } catch (error) {
    statusDiv.textContent = 'Network error. Please try again.';
    statusDiv.style.color = 'red';
  }
});
</script>
```

## jQuery Integration

If you're using jQuery:

```javascript
$('#contactForm').on('submit', function(e) {
  e.preventDefault();
  
  const formData = $(this).serializeArray().reduce((obj, item) => {
    obj[item.name] = item.value;
    return obj;
  }, {});
  
  $.ajax({
    url: 'https://your-canoforms-domain.com/api/v1/submit/YOUR_API_KEY/contact',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(formData),
    success: function() {
      $('#formStatus').html('Thank you! Your message has been sent.').css('color', 'green');
      $('#contactForm')[0].reset();
    },
    error: function() {
      $('#formStatus').html('Error: Submission failed').css('color', 'red');
    }
  });
});
```

## CORS Considerations

Can-O-Forms validates the `Origin` header against your site's configured domain. Make sure:

1. Your site's domain in Can-O-Forms matches your actual domain
2. Include the `Origin` header (browsers do this automatically)
3. For local testing, you may need to temporarily allow `localhost` origins

## Form Fields

You can send any JSON data in the form submission:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!",
  "phone": "555-1234",
  "company": "Acme Inc",
  "custom_field": "any value"
}
```

All fields are stored as-is in the submission data.

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Submission received"
}
```

### Error Responses

**Invalid origin (403 Forbidden)**:
```json
{
  "error": "Invalid origin"
}
```

**Rate limited (429 Too Many Requests)**:
```json
{
  "error": "Rate limit exceeded"
}
```

**Spam detected (200 OK but flagged)**:
```json
{
  "success": true,
  "message": "Submission received"
}
```
Note: Spam submissions still return 200 but are flagged in the admin dashboard.

## Testing Your Integration

1. Submit a test form from your site
2. Check the submissions in the Can-O-Forms admin dashboard
3. Verify email notifications are received (if configured)
4. Check that spam protection is working (test the honeypot)

## Troubleshooting

**"Invalid origin" error**:
- Verify the domain in your site settings matches your actual domain
- Check for trailing slashes or protocol prefixes (should be just "example.com")

**Form not submitting**:
- Check browser console for JavaScript errors
- Verify the API endpoint URL is correct
- Ensure CORS headers are being sent

**No email notifications**:
- Verify SMTP configuration in your Can-O-Forms environment
- Check notification email addresses are correct
- Look for errors in Can-O-Forms server logs
