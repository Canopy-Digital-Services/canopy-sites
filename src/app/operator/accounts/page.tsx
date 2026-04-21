import { listAccountsMetadata } from "@/lib/data-access/accounts";
import { listPlans } from "@/lib/data-access/plans";
import { listRoles } from "@/lib/data-access/roles";
import { requireGlobalAdmin } from "@/lib/auth-utils";
import { PageHeader } from "@/components/patterns/page-header";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { DeleteAccountButton } from "./delete-account-button";
import { ChangePlanButton } from "./change-plan-button";
import { ChangeRoleButton } from "./change-role-button";

export default async function AccountsPage() {
  const session = await requireGlobalAdmin();
  const currentUserId = session.user.id;

  const accounts = await listAccountsMetadata();
  const plans = await listPlans();
  const roles = await listRoles();

  const planOptions = plans.map((p) => ({
    code: p.code,
    displayName: p.displayName,
    maxPublishedForms: p.maxPublishedForms,
  }));
  const roleOptions = roles.map((r) => ({
    code: r.code,
    displayName: r.displayName,
  }));

  const globalAdminCount = accounts.filter(
    (a) => a.roleCode === "GLOBAL_ADMIN"
  ).length;

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
        <Badge variant="secondary">
          {account.publishedFormsCount}/{account.formsCount}
        </Badge>
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
      key: "plan",
      header: "Plan",
      cell: (account: typeof accounts[0]) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{account.planDisplayName}</Badge>
          {account.requiresPlanResolution && (
            <span className="text-xs text-muted-foreground">
              (resolution pending)
            </span>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (account: typeof accounts[0]) => (
        <Badge
          variant={account.roleCode === "GLOBAL_ADMIN" ? "default" : "secondary"}
        >
          {account.roleDisplayName}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (account: typeof accounts[0]) => (
        <div className="flex items-center gap-1">
          <ChangeRoleButton
            userId={account.userId}
            email={account.email}
            currentRoleCode={account.roleCode}
            currentPlanCode={account.planCode}
            isSelf={account.userId === currentUserId}
            isLastGlobalAdmin={
              account.roleCode === "GLOBAL_ADMIN" && globalAdminCount <= 1
            }
            roles={roleOptions}
          />
          <ChangePlanButton
            accountId={account.id}
            email={account.email}
            currentPlanCode={account.planCode}
            currentPublishedFormsCount={account.publishedFormsCount}
            plans={planOptions}
          />
          <DeleteAccountButton
            accountId={account.id}
            email={account.email}
          />
        </div>
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
