import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function SitesPage() {
  const userId = await getCurrentUserId();

  const sites = await prisma.site.findMany({
    where: { userId },
    include: {
      _count: {
        select: { forms: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sites</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage your client sites and form configurations
          </p>
        </div>
        <Link href="/sites/new">
          <Button>Create Site</Button>
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No sites yet</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Get started by creating your first site
          </p>
          <Link href="/sites/new">
            <Button>Create Site</Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Forms</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/sites/${site.id}`}
                      className="hover:underline"
                    >
                      {site.name}
                    </Link>
                  </TableCell>
                  <TableCell>{site.domain}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                      {site.apiKey.substring(0, 12)}...
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{site._count.forms}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/sites/${site.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link href={`/sites/${site.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
