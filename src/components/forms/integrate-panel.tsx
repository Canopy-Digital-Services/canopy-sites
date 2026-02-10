"use client";

import { RightPanel } from "@/components/patterns/right-panel";
import { CopyButton } from "@/components/copy-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFieldTypeLabel } from "@/lib/field-types";

type IntegratePanelProps = {
  open: boolean;
  onClose: () => void;
  apiUrl: string; // Added: pass from server-side
  form: {
    id: string;
    name: string;
    slug: string;
    honeypotField: string | null;
    allowedOrigins: string[];
    fields: Array<{
      id: string;
      name: string;
      label: string;
      type: string;
      required: boolean;
    }>;
  };
};

export function IntegratePanel({ open, onClose, apiUrl, form }: IntegratePanelProps) {
  const endpoint = `${apiUrl}/api/submit/${form.id}`;

  const embedCode = `<div 
  data-canopy-form="${form.id}"
  data-base-url="${apiUrl}"
></div>
<script src="${apiUrl}/embed.js" defer></script>`;

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
    
    const payload = await response.json();
    if (response.ok) {
      alert('Form submitted successfully!');
      e.target.reset();
    } else if (payload?.fields) {
      alert('Validation failed. Check field errors in the response.');
      console.warn('Field errors:', payload.fields);
    } else {
      alert(payload?.error || 'Failed to submit form');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred');
  }
});
</script>`;

  return (
    <RightPanel open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title="Integrate">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add this form to your website using one of the methods below.
        </p>

        <Tabs defaultValue="embed" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="embed">Embed Code</TabsTrigger>
            <TabsTrigger value="manual">Manual HTML</TabsTrigger>
            <TabsTrigger value="single-field">Single Field</TabsTrigger>
          </TabsList>

          <TabsContent value="embed" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Embed Code (Recommended)</CardTitle>
                  <CopyButton text={embedCode} />
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                  <code>{embedCode}</code>
                </pre>
                <p className="text-sm text-muted-foreground mt-2">
                  Paste this code where you want the form to appear.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Endpoint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 mr-2">
                    {endpoint}
                  </code>
                  <CopyButton text={endpoint} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Forms automatically submit to this endpoint.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">HTML + JavaScript</CardTitle>
                  <CopyButton text={htmlExample} />
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                  <code>{htmlExample}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="single-field" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              <p>
                Use these URLs when integrating with external tools that don't support
                custom JSON payloads. Each field has its own dedicated endpoint.
              </p>
            </div>

            {form.fields.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Add fields to your form to see single-field URLs.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {form.fields.map((field) => {
                  const fieldEndpoint = `${apiUrl}/api/submit/${form.id}/${field.name}`;
                  return (
                    <Card key={field.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">
                              {field.label}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {getFieldTypeLabel(field.type)}
                            </span>
                            {field.required && (
                              <span className="text-xs text-destructive">Required</span>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all">
                            {fieldEndpoint}
                          </code>
                          <CopyButton text={fieldEndpoint} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Field name: <code className="bg-muted px-1 py-0.5 rounded">{field.name}</code>
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Card className="border-blue-200 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-base text-blue-600 dark:text-blue-400">
                  Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">Payload Format:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    JSON: <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{ "value": "..." }'}</code>
                  </li>
                  <li>
                    Plain text: <code className="bg-muted px-1 py-0.5 rounded text-xs">your value here</code>
                  </li>
                </ul>
                <p className="text-xs pt-2">
                  These endpoints accept a single field value and create a submission
                  with just that field populated. Perfect for simple integrations.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {form.honeypotField && (
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="text-base text-blue-600 dark:text-blue-400">
                Honeypot Field
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                This form uses a honeypot field named{" "}
                <code className="bg-muted px-2 py-1 rounded">{form.honeypotField}</code>
                {" "}for spam protection.
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Include it in your form with display: none</li>
                <li>Keep it empty for legitimate users</li>
                <li>Filled fields are marked as spam</li>
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              {form.allowedOrigins.length > 0 ? (
                <li>
                  Allowed origins: {form.allowedOrigins.map((origin, i) => (
                    <code key={i} className="bg-muted px-1 py-0.5 rounded mx-1">{origin}</code>
                  ))}
                </li>
              ) : (
                <li className="text-destructive">
                  No allowed origins configured! Configure origins in Behavior settings to allow submissions.
                </li>
              )}
              <li>Rate limit: 10 submissions per IP per minute</li>
              <li>Localhost is always allowed for development</li>
              <li>CORS is enabled for allowed origins</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </RightPanel>
  );
}
