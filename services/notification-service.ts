import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? "INFO",
    },
  });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
}
