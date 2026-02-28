# Future Features

## Separate Label/Value for Select Options

**Current behavior (v3.2):** Users enter the option name once, and it's used as both the label (what users see) and value (what gets stored).

**Future enhancement:** Add ability to specify different submission values from labels. For example:
- Label: "United States" → Value: `US` (for CRM/API integration)
- Label: "Pro Plan - $29/month" → Value: `plan_pro` (for billing system compatibility)

**Use case:** Enables advanced integrations with CRMs, payment gateways, and other systems that require specific data formats or codes.

## Hosting

**Future enhancement:** Stand-alone front end. Canopy Forms-branded for use by individuals

## Email Field Auto-Send Configuration

**Future enhancement:** Allow email field types to automatically send emails to the submitted email address.

**Feature details:**
- Configure auto-send behavior per email field in the form editor
- Define email template (subject, body) in the dashboard
- Support for merge tags to include submitted form data in the email
- Use cases: confirmation emails, thank you messages, download links, next steps

**Technical considerations:**
- Requires email template editor in admin UI
- Template variables/merge tags for dynamic content
- Integration with existing SMTP configuration
- May want to combine with broader "Email to Submitter" feature

## Email to Submitter

**Future enhancement:** The ability to configure a form to send an email to the person who submitted it. Would require an email editor which is a lot of extra work. May need to wait until a major level bump which would also include some customization of the hosted solution.

## Email Change

**Future enhancement:** Allow authenticated users to update their email address from within the app.

**Feature details:**
- User initiates email change from account settings
- Verification email sent to the new address
- Old address receives a notification of the change
- Change is only confirmed after the new address is verified
- Re-authentication (password prompt) required before initiating the change

**Technical considerations:**
- Requires email verification flow (token-based)
- Should invalidate any existing sessions or prompt re-login after confirmed change
- Guard against email enumeration during the verification step

**Future enhancement:** Multiple titled sections on the form