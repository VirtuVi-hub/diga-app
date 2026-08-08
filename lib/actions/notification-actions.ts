"use server";

import { getCurrentPerson } from "@/lib/auth/current-person";
import { NotificationRepository } from "@/lib/repositories/notification-repository";

/**
 * Sprint 5.9, Module 1: "my own notifications" — reading/writing by the
 * currently signed-in person is a genuinely per-request concern, kept
 * entirely in this `"use server"` file (safe to use `getCurrentPerson()`/
 * `next/headers` here) rather than in `NotificationService`, which the
 * event subscriber path must keep free of any such dependency (see that
 * file's own comment on the client-bundle-leak this would otherwise cause).
 */
export async function getMyNotifications(projectId: string) {
  const person = await getCurrentPerson();
  if (!person) return [];
  return NotificationRepository.listForRecipient(person.id, projectId);
}

export async function getMyUnreadNotificationCount(projectId: string) {
  const person = await getCurrentPerson();
  if (!person) return 0;
  return NotificationRepository.unreadCount(person.id, projectId);
}

export async function markNotificationRead(id: string) {
  const person = await getCurrentPerson();
  if (!person) return;
  await NotificationRepository.markRead(id, person.id);
}

export async function markAllNotificationsRead(projectId: string) {
  const person = await getCurrentPerson();
  if (!person) return;
  await NotificationRepository.markAllRead(person.id, projectId);
}
