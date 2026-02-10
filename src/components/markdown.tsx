import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-heading font-bold mt-8 mb-4 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-heading font-semibold mt-6 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-heading font-semibold mt-4 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-7">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-7">{children}</li>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`block rounded-lg bg-muted p-4 text-sm font-mono overflow-x-auto ${className || ''}`}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto">{children}</pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary hover:underline"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-border pl-4 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/40">{children}</thead>,
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border">
              {children}
            </tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm">{children}</td>
          ),
          hr: () => <hr className="my-8 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
