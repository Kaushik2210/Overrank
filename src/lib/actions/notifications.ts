"use server";

import { run } from "./helpers";
import { getRepo } from "@/lib/data";

export async function listNotificationsAction() {
  return run({}, (s) => getRepo().listNotifications(s.userId));
}

export async function markNotificationReadAction(id: string) {
  return run({}, (s) => getRepo().markNotificationRead(s.userId, id));
}

export async function dismissNotificationAction(id: string) {
  return run({}, (s) => getRepo().dismissNotification(s.userId, id));
}
