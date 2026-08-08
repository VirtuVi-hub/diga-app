export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const isSameDay = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  if (isSameDay) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;

  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${time}`;
}
