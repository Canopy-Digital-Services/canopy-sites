import { prisma } from "@/lib/db";

export type RoleRecord = {
  code: string;
  displayName: string;
  description: string | null;
  isPublic: boolean;
  sortOrder: number;
};

export async function listRoles(): Promise<RoleRecord[]> {
  return prisma.role.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function getRole(code: string): Promise<RoleRecord> {
  const role = await prisma.role.findUnique({ where: { code } });
  if (!role) {
    throw new Error(`Role not found: ${code}`);
  }
  return role;
}
