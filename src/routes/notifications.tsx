import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useBank } from "@/lib/bank/store";
import { formatDateTime } from "@/lib/bank/logic";
import { EmptyState, PageHeader } from "@/components/bank/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications - Kilele Bank" },
      { name: "description", content: "Alerts and messages in the Kilele Bank demo app." },
      { property: "og:title", content: "Notifications - Kilele Bank" },
      { property: "og:description", content: "Demo alerts and messages." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { state, markNotificationRead, markAllNotificationsRead, clearNotifications, t } = useBank();
  const items = [...state.notifications].sort((a, b) => b.date.localeCompare(a.date));
  const unread = items.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader title={t("notifications")} />
      <div className="p-4">
        {items.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="You're all caught up"
            body="New alerts about your transactions will show up here."
          />
        ) : (
          <>
            <div className="mb-3 flex gap-2">
              <Button
                variant="soft"
                size="sm"
                disabled={unread === 0}
                onClick={() => {
                  markAllNotificationsRead();
                  toast.success("All notifications marked as read");
                }}
              >
                <CheckCheck /> Mark all read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearNotifications();
                  toast.success("Notifications cleared");
                }}
              >
                <Trash2 /> Clear all
              </Button>
              <span className="ml-auto self-center text-xs text-muted-foreground">{unread} unread</span>
            </div>
            <ul className="divide-y rounded-2xl bg-card px-3 shadow-card">
              {items.map((n) => {
                const { date, time } = formatDateTime(n.date);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className="flex w-full items-start gap-3 py-3 text-left"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                          n.read ? "bg-transparent" : "bg-primary",
                        )}
                        aria-label={n.read ? "Read" : "Unread"}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm text-foreground", n.read ? "font-medium" : "font-bold")}>{n.title}</span>
                        <span className="block text-sm text-muted-foreground">{n.body}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {date} · {time}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
