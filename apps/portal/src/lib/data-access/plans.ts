import { prisma } from "@/lib/db";

export type PlanRecord = {
  code: string;
  displayName: string;
  description: string | null;
  maxPublishedForms: number | null;
  isPublic: boolean;
  sortOrder: number;
};

export async function listPlans(): Promise<PlanRecord[]> {
  return prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPlan(code: string): Promise<PlanRecord> {
  const plan = await prisma.plan.findUnique({ where: { code } });
  if (!plan) {
    throw new Error(`Plan not found: ${code}`);
  }
  return plan;
}
