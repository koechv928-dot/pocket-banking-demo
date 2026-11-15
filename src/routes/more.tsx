import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, CreditCard, Database, FileText, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { useBank } from "@/lib/bank/store";
import { HOLDER } from "@/lib/bank/profile";
import { MenuLink, PageHeader } from "@/components/bank/PageHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More - Kilele Bank" },
      { name: "description", content: "Profile, notifications, statements and settings in the Kilele Bank demo app." },
      { property: "og:title", content: "More - Kilele Bank" },
      { property: "og:description", content: "Profile, alerts and settings." },
    ],
  }),
  component: More,
});

function More() {
  const { state, logout, t } = useBank();
  const navigate = useNavigate();
  const unread = state.notifications.filter((n) => !n.read).length;
  return (
    <div>
      <PageHeader title={t("more")} back={false} />
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-bold text-primary">
            {HOLDER.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-foreground">{HOLDER.fullName}</p>
            <p className="text-xs text-muted-foreground">{HOLDER.branch}</p>
          </div>
        </div>

        <nav className="rounded-2xl bg-card p-1 shadow-card" aria-label="More options">
          <MenuLink to="/profile" icon={<User className="h-5 w-5" />} label={t("profile")} hint="Your details and accounts" />
          <MenuLink
            to="/notifications"
            icon={<Bell className="h-5 w-5" />}
            label={t("notifications")}
            hint={unread ? `${unread} unread` : "No new alerts"}
          />
          <MenuLink to="/statements" icon={<FileText className="h-5 w-5" />} label={t("statements")} hint="Filter, view and download" />
          <MenuLink to="/cards" icon={<CreditCard className="h-5 w-5" />} label={t("myCards")} hint="Freeze card and set limits" />
          <MenuLink to="/demo-editor" icon={<Database className="h-5 w-5" />} label={t("demoEditor")} hint="Edit balances, transactions, merchants" />
          <MenuLink to="/settings" icon={<SettingsIcon className="h-5 w-5" />} label={t("settings")} hint="PIN, language, dark mode" />
        </nav>

        <Button
          variant="outline"
          size="xl"
          className="w-full"
          onClick={() => {
            logout();
            navigate({ to: "/", replace: true });
          }}
        >
          <LogOut /> {t("logout")}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">Demo mode - no real money moves.</p>
      </div>
    </div>
  );
}
