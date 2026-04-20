"use server";

import { prisma } from "@/lib/db";
import { getCurrentAccountId } from "@/lib/auth-utils";
import {
  listNotificationsForAccount,
  type NotificationListItem,
} from "@/lib/data-access/notifications";

export async function listMyNotifications(): Promise<NotificationListItem[]> {
  const accountId = await getCurrentAccountId();
  return listNotificationsForAccount(accountId);
}

export async function dismissNotification(id: string): Promise<void> {
  const accountId = await getCurrentAccountId();
  await prisma.notification.deleteMany({
    where: { id, accountId },
  });
}

export async function dismissAllNotifications(): Promise<void> {
  const accountId = await getCurrentAccountId();
  await prisma.notification.deleteMany({
    where: { accountId },
  });
}
