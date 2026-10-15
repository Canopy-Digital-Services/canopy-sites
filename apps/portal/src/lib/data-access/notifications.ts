/**
 * Data access helpers for notifications (bell).
 * Notification ownership is via accountId. Writes to Notification happen from
 * two contexts:
 *   1. Public submission pipeline (no session) — uses the form's accountId.
 *   2. Admin dismissals — uses the session's accountId.
 */

import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  count: number;
  updatedAt: Date;
  formId: string;
  formName: string;
};

export async function listNotificationsForAccount(
  accountId: string
): Promise<NotificationListItem[]> {
  const rows = await prisma.notification.findMany({
    where: { accountId },
    orderBy: { updatedAt: "desc" },
    include: { form: { select: { id: true, name: true } } },
  });

  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    count: n.count,
    updatedAt: n.updatedAt,
    formId: n.form.id,
    formName: n.form.name,
  }));
}

export async function upsertSubmissionNotification(
  accountId: string,
  formId: string
) {
  await prisma.notification.upsert({
    where: {
      accountId_formId_type: {
        accountId,
        formId,
        type: "NEW_SUBMISSION",
      },
    },
    create: {
      accountId,
      formId,
      type: "NEW_SUBMISSION",
      count: 1,
    },
    update: {
      count: { increment: 1 },
    },
  });
}

export async function upsertLimitNotification(
  accountId: string,
  formId: string,
  type: "LIMIT_MAX_REACHED" | "LIMIT_DEADLINE_REACHED"
) {
  await prisma.notification.upsert({
    where: {
      accountId_formId_type: { accountId, formId, type },
    },
    create: { accountId, formId, type, count: 1 },
    update: { updatedAt: new Date() },
  });
}
