import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Eye, EyeOff } from "lucide-react";
import { useBank } from "@/lib/bank/store";
import { HOLDER } from "@/lib/bank/profile";
import { formatKES, maskAccount, sortTxns } from "@/lib/bank/logic";
import { TxnRow } from "@/components/bank/TxnRow";
import { SectionTitle, EmptyState } from "@/components/bank/PageHeader";
import { InstallBanner } from "@/components/bank/InstallPrompt";
import mountain from "@/assets/mountain-card.jpg";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home - Kilele Bank" },
      { name: "description", content: "Your Kilele Bank demo accounts, balances and recent transactions." },
      { property: "og:title", content: "Home - Kilele Bank" },
      { property: "og:description", content: "Demo accounts, balances and recent transactions." },
    ],
  }),
  component: Home,
});

function Home() {
  const { state, balance, setSettings, t } = useBank();
  const hide = state.settings.hideBalance;
  const unread = state.notifications.some((n) => !n.read);
  const recent = sortTxns(state.transactions).slice(0, 5);
  return (
    <div className="px-4 pt-4">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary font-semibold text-primary">{HOLDER.initials}</span>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{t("goodAfternoon")}</p>
          <p className="text-lg font-bold text-foreground">{t("hello")}, {HOLDER.firstName}</p>
        </div>
        <Bell className="h-6 w-6 text-foreground" aria-label={unread ? "Unread notifications" : "Notifications"} />
      </header>
      <div className="mt-4 space-y-3">
        {state.accounts.map((a) => (
          <div key={a.id} className="relative h-40 overflow-hidden rounded-2xl text-on-photo shadow-card">
            <img src={mountain} alt="" width={1280} height={768} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-photo-overlay" />
            <div className="relative p-4">
              <p className="text-xs opacity-90">{a.name} ({maskAccount(a.number)})</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-2xl font-bold">{hide ? "KES ******" : formatKES(balance(a.id))}</p>
                <button type="button" aria-label={hide ? "Show balance" : "Hide balance"} onClick={() => setSettings({ hideBalance: !hide })}>
                  {hide ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-xl border-l-4 border-primary bg-notice p-3 text-xs text-notice-foreground">{t("securityNotice")}</p>
      <InstallBanner />
      <SectionTitle action={<Link to="/statements" className="text-xs font-semibold text-primary">{t("seeAll")}</Link>}>
        {t("recentTransactions")}
      </SectionTitle>
      <div className="divide-y rounded-2xl bg-card px-3 shadow-card">
        {recent.length === 0 ? (
          <EmptyState icon={<Bell className="h-6 w-6" />} title={t("noTransactions")} />
        ) : (
          recent.map((x) => <TxnRow key={x.id} txn={x} hideAmount={hide} />)
        )}
      </div>
    </div>
  );
}
