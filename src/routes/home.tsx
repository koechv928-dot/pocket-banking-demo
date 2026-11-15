import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowDown, ArrowLeftRight, ArrowUp, Bell, ChevronRight, Eye, EyeOff, Megaphone, QrCode, Send } from "lucide-react";
import { toast } from "sonner";
import { useBank } from "@/lib/bank/store";
import { HOLDER } from "@/lib/bank/profile";
import { formatKES, maskAccount, sortTxns } from "@/lib/bank/logic";
import type { QuickActionId } from "@/lib/bank/types";
import { TxnRow } from "@/components/bank/TxnRow";
import { SectionTitle, EmptyState } from "@/components/bank/PageHeader";
import { InstallBanner } from "@/components/bank/InstallPrompt";
import { QrDialog } from "@/components/bank/QrDialog";
import { QUICK_ACTIONS } from "@/components/bank/QuickActions";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import mountain from "@/assets/mountain-card.jpg";
import tileCoins from "@/assets/tile-coins.png";
import tileStatement from "@/assets/tile-statement.png";
import tilePhone from "@/assets/tile-phone.png";
import tileCard from "@/assets/tile-card.png";

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

function greetingKey() {
  const h = new Date().getHours();
  return h < 12 ? "goodMorning" : h < 17 ? "goodAfternoon" : "goodEvening";
}

function Home() {
  const { state, balance, setSettings, t } = useBank();
  const hide = state.settings.hideBalance;
  const unread = state.notifications.filter((n) => !n.read).length;
  const recent = sortTxns(state.transactions).slice(0, 5);
  const [qr, setQr] = useState(false);
  const [edit, setEdit] = useState(false);
  const [slide, setSlide] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const actions = state.settings.quickActions
    .map((id) => QUICK_ACTIONS.find((a) => a.id === id))
    .filter((a): a is (typeof QUICK_ACTIONS)[number] => !!a);

  const cardActions = [
    { label: t("sendToMobile"), icon: Send, link: { to: "/send", search: { type: "mobile" } } },
    { label: t("sendToBank"), icon: ArrowLeftRight, link: { to: "/send", search: { type: "bank" } } },
    { label: t("pay"), icon: ArrowUp, link: { to: "/bills", search: { tab: "billers" } } },
    { label: t("deposit"), icon: ArrowDown, link: { to: "/mpesa", search: { mode: "topup" } } },
  ];

  const tiles = [
    { label: t("savings"), img: tileCoins, cls: "bg-steel", link: { to: "/send", search: { type: "own" } } },
    { label: t("statements"), img: tileStatement, cls: "bg-navy", link: { to: "/statements" } },
    { label: t("mpesa"), img: tilePhone, cls: "bg-teal", link: { to: "/mpesa", search: { mode: "withdraw" } } },
    { label: t("cards"), img: tileCard, cls: "bg-lime", link: { to: "/cards" } },
  ];

  return (
    <div className="px-4 pt-4">
      <header className="flex items-center gap-3">
        <Link to="/profile" aria-label="Profile" className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-base font-semibold text-primary">
          {HOLDER.initials}
        </Link>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{t(greetingKey())}</p>
          <p className="text-lg font-bold leading-tight text-foreground">
            {t("hello")}, {HOLDER.firstName}
          </p>
        </div>
        <button type="button" onClick={() => setQr(true)} aria-label="Show my QR code" className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted">
          <QrCode className="h-6 w-6" />
        </button>
        <Link to="/notifications" aria-label={`${t("notifications")}${unread ? ` (${unread} unread)` : ""}`} className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted">
          <Bell className="h-6 w-6" />
          {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-background bg-destructive" />}
        </Link>
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setSlide(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory overflow-x-auto px-4"
      >
        {state.accounts.map((a) => (
          <div key={a.id} className="w-full shrink-0 snap-center pr-0 [&:not(:last-child)]:mr-3">
            <div className="relative overflow-hidden rounded-2xl text-on-photo shadow-card">
              <img src={mountain} alt="" width={1280} height={768} className="absolute inset-0 h-full w-full object-cover" />
              <div className={cn("absolute inset-0", a.type === "savings" ? "bg-savings-overlay" : "bg-photo-overlay")} />
              <div className="relative p-4">
                <p className="text-xs opacity-90">
                  {a.type === "savings" ? a.name : t("accountBalance")} ( {maskAccount(a.number)} )
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <p className="text-2xl font-bold tracking-wide">{hide ? "KES ******" : formatKES(balance(a.id))}</p>
                  <button type="button" aria-label={hide ? "Show balance" : "Hide balance"} onClick={() => setSettings({ hideBalance: !hide })} className="rounded-full p-1 hover:bg-photo-glass">
                    {hide ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-4 gap-2">
                  {cardActions.map((c) => (
                    <Link key={c.label} {...(c.link as { to: "/airtime" })} className="flex flex-col items-center gap-1.5 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-photo-glass backdrop-blur-sm transition-transform active:scale-95">
                        <c.icon className="h-5 w-5" />
                      </span>
                      <span className="text-[11px] font-medium leading-tight">{c.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
        {state.accounts.map((a, i) => (
          <button
            key={a.id}
            type="button"
            tabIndex={-1}
            onClick={() => scroller.current?.scrollTo({ left: i * scroller.current.clientWidth, behavior: "smooth" })}
            className={cn("h-1.5 rounded-full transition-all", slide === i ? "w-5 bg-primary" : "w-1.5 bg-border")}
          />
        ))}
      </div>

      <div className="mt-3 flex gap-2 rounded-lg border-l-4 border-primary bg-notice p-3 text-[11px] leading-relaxed text-notice-foreground">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>{t("securityNotice")}</p>
      </div>

      <section className="mt-4 rounded-2xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{t("whatToDo")}</h2>
          <button type="button" onClick={() => setEdit(true)} className="text-sm font-semibold text-primary">
            {t("edit")}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {actions.map((a) => (
            <Link key={a.id} {...(a.link as { to: "/airtime" })} className="flex flex-col items-center gap-2 text-center">
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-95", a.circle)}>
                <a.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-medium leading-tight text-foreground">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <Link key={tile.label} {...(tile.link as { to: "/airtime" })} className={cn("relative flex h-[72px] items-center overflow-hidden rounded-xl px-3 text-on-photo shadow-card", tile.cls)}>
            <span className="relative z-10">
              <span className="block text-sm font-bold">{tile.label}</span>
              <span className="flex items-center text-[10px] opacity-90">
                {t("goToService")} <ChevronRight className="h-3 w-3" />
              </span>
            </span>
            <img src={tile.img} alt="" width={64} height={64} className="absolute -right-1 bottom-0 h-16 w-16 object-contain" />
          </Link>
        ))}
      </div>

      <InstallBanner />

      <SectionTitle action={<Link to="/statements" className="text-xs font-semibold text-primary">{t("seeAll")}</Link>}>
        {t("recentTransactions")}
      </SectionTitle>
      <div className="mb-4 divide-y rounded-2xl bg-card px-3 shadow-card">
        {recent.length === 0 ? (
          <EmptyState icon={<Bell className="h-6 w-6" />} title={t("noTransactions")} />
        ) : (
          recent.map((x) => <TxnRow key={x.id} txn={x} hideAmount={hide} />)
        )}
      </div>

      <QrDialog open={qr} onOpenChange={setQr} />
      <EditQuickActions open={edit} onOpenChange={setEdit} />
    </div>
  );
}

function EditQuickActions({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state, setSettings, t } = useBank();
  const [picked, setPicked] = useState<QuickActionId[]>(state.settings.quickActions);
  const toggle = (id: QuickActionId) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 4 ? p : [...p, id]));
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (v) setPicked(state.settings.quickActions);
        onOpenChange(v);
      }}
    >
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Edit quick actions</SheetTitle>
          <SheetDescription>Pick exactly 4 shortcuts for your Home screen ({picked.length}/4).</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-4 gap-3 px-4">
          {QUICK_ACTIONS.map((a) => {
            const on = picked.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(a.id)}
                className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-2 text-center text-[11px] font-medium text-foreground", on ? "border-primary bg-secondary" : "border-transparent")}
              >
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", a.circle)}>
                  <a.icon className="h-5 w-5" />
                </span>
                {a.label}
              </button>
            );
          })}
        </div>
        <div className="p-4">
          <Button
            size="xl"
            className="w-full"
            disabled={picked.length !== 4}
            onClick={() => {
              setSettings({ quickActions: picked });
              toast.success("Quick actions updated");
              onOpenChange(false);
            }}
          >
            {t("done")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
