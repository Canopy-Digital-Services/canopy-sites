"use client";

import { RightPanel } from "@/components/patterns/right-panel";
import { CopyButton } from "@/components/copy-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type IntegratePanelProps = {
  open: boolean;
  onClose: () => void;
  apiUrl: string; // Added: pass from server-side
  form: {
    id: string;
    name: string;
    slug: string;
    honeypotField: string | null;
    site: {
      name: string;
      domain: string;
      apiKey: string;
    };
  };
};

export function IntegratePanel({ open, onClose, apiUrl, form }: IntegratePanelProps) {
  const endpoint = `${apiUrl}/api/v1/submit/${form.site.apiKey}/${form.slug}`;

  const embedCode = `<div 
  data-can-o-form="${form.slug}"
  data-site-key="${form.site.apiKey}"
  data-base-url="${apiUrl}"
></div>
<script src="${apiUrl}/embed.js"></script>`;

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

  return (
    <RightPanel open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title="Integrate">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add this form to your website using one of the methods below.
        </p>

        <Tabs defaultValue="embed" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="embed">Embed Code</TabsTrigger>
            <TabsTrigger value="manual">Manual HTML</TabsTrigger>
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
              <li>
                Origin must match <code className="bg-muted px-1 py-0.5 rounded">{form.site.domain}</code>
              </li>
              <li>Rate limit: 10 submissions per IP per minute</li>
              <li>CORS is enabled for your domain</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </RightPanel>
  );
}
