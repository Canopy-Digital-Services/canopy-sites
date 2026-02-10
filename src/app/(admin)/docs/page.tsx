import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Markdown } from '@/components/markdown';

const docsDir = path.join(process.cwd(), 'content/docs');

export default async function DocsPage() {
  try {
    const indexPath = path.join(docsDir, 'index.md');
    const content = await fs.readFile(indexPath, 'utf-8');

    // Get list of other doc files for navigation
    const files = await fs.readdir(docsDir);
    const docPages = files
      .filter(file => file.endsWith('.md') && file !== 'index.md')
      .map(file => ({
        slug: file.replace('.md', ''),
        title: file.replace('.md', '').split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }));

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold mb-2">Help Documentation</h1>
          <p className="text-muted-foreground">
            Learn how to use Can-O-Forms to collect form submissions from your static sites
          </p>
        </div>

        <div className="mb-8">
          <Markdown content={content} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docPages.map(doc => (
            <Link key={doc.slug} href={`/docs/${doc.slug}`}>
              <Card className="h-full cursor-pointer transition-colors hover:border-muted-foreground/40">
                <CardHeader>
                  <CardTitle>{doc.title}</CardTitle>
                  <CardDescription>
                    Learn more about {doc.title.toLowerCase()}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div>
        <h1 className="text-3xl font-heading font-bold mb-4">Help Documentation</h1>
        <p className="text-muted-foreground">
          Documentation is being set up. Please check back soon.
        </p>
      </div>
    );
  }
}
