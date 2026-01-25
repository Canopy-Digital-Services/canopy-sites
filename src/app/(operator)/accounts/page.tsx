import { listAccountsMetadata } from "@/lib/data-access/accounts";
import { PageHeader } from "@/components/patterns/page-header";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { DeleteAccountButton } from "./delete-account-button";

export default async function AccountsPage() {
  const accounts = await listAccountsMetadata();

  const columns = [
    {
      key: "email",
      header: "Email",
      cell: (account: typeof accounts[0]) => (
        <span className="font-medium">{account.email}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (account: typeof accounts[0]) => (
        <span className="text-sm text-muted-foreground">
          {new Date(account.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "lastLoginAt",
      header: "Last Login",
      cell: (account: typeof accounts[0]) => (
        <span className="text-sm text-muted-foreground">
          {account.lastLoginAt
            ? new Date(account.lastLoginAt).toLocaleDateString()
            : "Never"}
        </span>
      ),
    },
    {
      key: "formsCount",
      header: "Forms",
      cell: (account: typeof accounts[0]) => (
        <Badge variant="secondary">{account.formsCount}</Badge>
      ),
    },
    {
      key: "submissionsCount",
      header: "Submissions",
      cell: (account: typeof accounts[0]) => (
        <Badge variant="secondary">{account.submissionsCount}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (account: typeof accounts[0]) => (
        <DeleteAccountButton
          accountId={account.id}
          email={account.email}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Manage platform accounts (metadata only)"
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10 text-muted-foreground" />}
          title="No accounts"
          description="No active accounts found"
        />
      ) : (
        <DataTable columns={columns} data={accounts} />
      )}
    </div>
  );
}
