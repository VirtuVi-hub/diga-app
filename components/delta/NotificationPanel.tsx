"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/format-time";
import type { Notification } from "@/lib/types/notification";

type Props = {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: () => void;
};

/**
 * Sprint 5.9, Module 1: the Notification Center's dropdown content. The
 * brief's own "Agreement Approved" example ships two actions inline — a
 * primary CTA (e.g. "Begin Project Setup") and a secondary, dismiss-only
 * one ("Later") — rendered generically for every notification type that
 * carries them, not hardcoded to that one example.
 */
export function NotificationPanel({ notifications, onMarkRead, onMarkAllRead, onNavigate }: Props) {
  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-96 max-w-[90vw] rounded-2xl border border-border-subtle bg-surface-secondary shadow-lg">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <p className="font-display text-sm font-semibold text-text-primary">Notifications</p>
        {notifications.some((notification) => !notification.read_at) && (
          <button type="button" onClick={onMarkAllRead} className="text-xs font-medium text-accent-primary hover:underline">
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-text-tertiary">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {notifications.map((notification) => (
              <li key={notification.id} className={`px-4 py-3 ${notification.read_at ? "" : "bg-accent-primary/5"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-text-primary">{notification.title}</p>
                  <span className="shrink-0 text-[11px] text-text-tertiary">{formatDateTime(notification.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-text-secondary">{notification.body}</p>

                {(notification.primary_action_label || notification.secondary_action_label) && (
                  <div className="mt-2 flex items-center gap-2">
                    {notification.primary_action_label && notification.primary_action_url && (
                      <Link
                        href={notification.primary_action_url}
                        onClick={() => {
                          onMarkRead(notification.id);
                          onNavigate();
                        }}
                        className="rounded-full bg-accent-primary px-3 py-1.5 text-xs font-medium text-white"
                      >
                        {notification.primary_action_label}
                      </Link>
                    )}
                    {notification.secondary_action_label && (
                      <button
                        type="button"
                        onClick={() => {
                          onMarkRead(notification.id);
                          onNavigate();
                        }}
                        className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary"
                      >
                        {notification.secondary_action_label}
                      </button>
                    )}
                  </div>
                )}

                {!notification.read_at && !notification.primary_action_label && !notification.secondary_action_label && (
                  <button type="button" onClick={() => onMarkRead(notification.id)} className="mt-2 text-xs font-medium text-accent-primary hover:underline">
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
