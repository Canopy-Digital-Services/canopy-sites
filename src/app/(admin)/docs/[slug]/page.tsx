import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/markdown';
import { ChevronLeft } from 'lucide-react';

const docsDir = path.join(process.cwd(), 'content/docs');

interface DocPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  try {
    const files = await fs.readdir(docsDir);
    return files
      .filter(file => file.endsWith('.md') && file !== 'index.md')
      .map(file => ({
        slug: file.replace('.md', ''),
      }));
  } catch {
    return [];
  }
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  
  try {
    const filePath = path.join(docsDir, `${slug}.md`);
    const content = await fs.readFile(filePath, 'utf-8');

    // Extract title from first # heading or use slug
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch 
      ? titleMatch[1] 
      : slug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

    return (
      <div>
        <div className="mb-6">
          <Link href="/docs">
            <Button variant="ghost" className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Docs
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>

        <Markdown content={content} />

        <div className="mt-8 border-t border-border pt-8">
          <Link href="/docs">
            <Button variant="ghost">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Documentation
            </Button>
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
