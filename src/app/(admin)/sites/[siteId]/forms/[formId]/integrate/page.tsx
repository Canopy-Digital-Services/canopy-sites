import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";

export default async function IntegratePage({
  params,
}: {
  params: { siteId: string; formId: string };
}) {
  const userId = await getCurrentUserId();

  const site = await prisma.site.findFirst({
    where: {
      id: params.siteId,
      userId,
    },
    include: {
      forms: {
        where: { id: params.formId },
      },
    },
  });

  if (!site || site.forms.length === 0) {
    notFound();
  }

  const form = site.forms[0];
  const apiUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const endpoint = `${apiUrl}/api/v1/submit/${site.apiKey}/${form.slug}`;

  const htmlExample = `<form id="contact-form">
  <input type="text" name="name" placeholder="Your name" required>
  <input type="email" name="email" placeholder="Your email" required>
  <textarea name="message" placeholder="Your message" required></textarea>
  ${form.honeypotField ? `<input type="text" name="${form.honeypotField}" style="display:none">` : ""}
  <button type="submit">Send</button>
</form>

<script>
document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  
  try {
    const response = await fetch('${endpoint}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert('Form submitted successfully!');
      e.target.reset();
    } else {
      alert('Failed to submit form');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred');
  }
});
</script>`;

  const fetchExample = `// Basic fetch example
const submitForm = async (formData) => {
  try {
    const response = await fetch('${endpoint}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Success:', result);
      return result;
    } else {
      console.error('Error:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Example usage
await submitForm({
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello from my static site!'${form.honeypotField ? `,\n  ${form.honeypotField}: '' // Keep empty for real users` : ""}
});`;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integration Guide</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {form.name} on {site.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Endpoint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">POST URL</div>
            <div className="flex gap-2">
              <code className="flex-1 text-sm bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded overflow-x-auto">
                {endpoint}
              </code>
              <CopyButton text={endpoint} />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Headers</div>
            <code className="block text-sm bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded">
              Content-Type: application/json
            </code>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Request Body</div>
            <code className="block text-sm bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded">
              {`{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Your message here"${form.honeypotField ? `,\n  "${form.honeypotField}": ""` : ""}
}`}
            </code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>HTML + JavaScript Example</CardTitle>
            <CopyButton text={htmlExample} />
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 p-4 rounded overflow-x-auto">
            <code>{htmlExample}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>JavaScript Fetch Example</CardTitle>
            <CopyButton text={fetchExample} />
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 p-4 rounded overflow-x-auto">
            <code>{fetchExample}</code>
          </pre>
        </CardContent>
      </Card>

      {form.honeypotField && (
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">
              Honeypot Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This form has a honeypot field named{" "}
              <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                {form.honeypotField}
              </code>
              . Make sure to:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>Include this field in your HTML form</li>
              <li>Hide it with CSS (display: none)</li>
              <li>Keep it empty for legitimate users</li>
              <li>
                If the field is filled, the submission will be marked as spam
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
            <li>
              The Origin header must match{" "}
              <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                {site.domain}
              </code>{" "}
              (or www.{site.domain})
            </li>
            <li>Rate limiting: 10 submissions per IP per minute</li>
            <li>All form data is stored as JSON (arbitrary fields accepted)</li>
            <li>
              Successful submissions return{" "}
              <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                {`{ "success": true, "id": "..." }`}
              </code>
            </li>
            <li>
              CORS is enabled automatically for your domain
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
