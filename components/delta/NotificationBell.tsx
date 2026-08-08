"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { getMyNotifications, getMyUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notification-actions";
import { NotificationPanel } from "./NotificationPanel";
import type { Notification } from "@/lib/types/notification";

const POLL_INTERVAL_MS = 30000;

/**
 * Sprint 5.9, Module 1: replaces the decorative Bell button
 * `TopBar.tsx` used to render. No websocket/push infra exists anywhere in
 * this codebase (an honest, documented limitation every prior sprint has
 * carried) — this polls the real unread count on mount and periodically,
 * matching the "revalidate on write, refetch on demand" pattern every
 * other page in this app already uses, never a fabricated real-time feel.
 */
export function NotificationBell({ projectId }: { projectId?: string }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(() => {
    if (!projectId) return;
    getMyUnreadNotificationCount(projectId)
      .then(setUnreadCount)
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function toggleOpen() {
    if (!projectId) return;
    const next = !open;
    setOpen(next);
    if (next) {
      const list = await getMyNotifications(projectId);
      setNotifications(list);
    }
  }

  async function handleMarkRead(id: string) {
    setNotifications((current) => current.map((notification) => (notification.id === id ? { ...notification, read_at: notification.read_at ?? new Date().toISOString() } : notification)));
    setUnreadCount((count) => Math.max(0, count - 1));
    await markNotificationRead(id);
  }

  async function handleMarkAllRead() {
    if (!projectId) return;
    setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
    await markAllNotificationsRead(projectId);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={toggleOpen}
        className="relative grid size-9 place-items-center rounded-lg text-text-secondary transition hover:bg-surface-tertiary hover:text-text-primary"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-error text-[10px] font-semibold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && <NotificationPanel notifications={notifications} onMarkRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} onNavigate={() => setOpen(false)} />}
    </div>
  );
}
