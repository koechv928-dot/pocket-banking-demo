import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  CreditCard,
  FileText,
  Home,
  Landmark,
  LayoutGrid,
  Lightbulb,
  Menu,
  Phone,
  Smartphone,
  Store,
  Wallet,
  Compass,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { BankProvider, useBankMaybe, useBankReady } from "@/lib/bank/store";
import { InstallProvider } from "./InstallPrompt";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IDLE_LOGOUT_MS, IDLE_WARN_MS } from "@/lib/bank/profile";
import { registerServiceWorker } from "@/lib/pwa";
import { cn } from "@/lib/utils";
import kileleLogo from "@/assets/kilele-logo.png";

const PUBLIC_PATHS = ["/", "/forgot-pin"];

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => registerServiceWorker(), []);
  return (
    <BankProvider>
      <InstallProvider>
        <Gate>{children}</Gate>
      </InstallProvider>
    </BankProvider>
  );
}

export function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-splash text-on-photo">
      <img src={kileleLogo} alt="Kilele Bank" width={112} height={112} className="h-28 w-28 rounded-3xl shadow-fab animate-pop" />
      <div className="text-center">
        <p className="text-2xl font-bold tracking-wide">Kilele Bank</p>
        <p className="text-sm opacity-80">Reach higher, every day</p>
      </div>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-photo-glass">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand" />
      </div>
    </div>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const ready = useBankReady();
  const bank = useBankMaybe();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const authed = bank?.authed ?? false;

  useEffect(() => {
    if (!ready) return;
    if (!authed && !isPublic) navigate({ to: "/", replace: true });
    else if (authed && pathname === "/") navigate({ to: "/home", replace: true });
  }, [ready, authed, isPublic, pathname, navigate]);

  if (!ready || (!authed && !isPublic) || (authed && pathname === "/")) {
    return (
      <div className="mx-auto max-w-md">
        <Splash />
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-dvh max-w-md overflow-x-hidden bg-background shadow-2xl">
      <div key={pathname} className={cn("animate-in fade-in slide-in-from-right-4 duration-300", !isPublic && "pb-28")}>
        {children}
      </div>
      {!isPublic && authed && <BottomNav pathname={pathname} />}
      {authed && <IdleWatcher />}
    </div>
  );
}

const TRANSACT = ["/transact", "/send", "/mpesa", "/bills", "/airtime"];
const MORE = ["/more", "/profile", "/settings", "/statements", "/demo-editor", "/notifications", "/change-pin"];

function BottomNav({ pathname }: { pathname: string }) {
  const bank = useBankMaybe();
  const [explore, setExplore] = useState(false);
  const t = bank!.t;
  const active = (p: string) =>
    p === "/transact"
      ? TRANSACT.some((x) => pathname.startsWith(x))
      : p === "/more"
        ? MORE.some((x) => pathname.startsWith(x))
        : pathname.startsWith(p);

  const item = (to: "/home" | "/transact" | "/cards" | "/more", label: string, Icon: typeof Home) => (
    <Link
      to={to}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-1 pt-2 text-[11px] font-medium transition-colors",
        active(to) ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {active(to) && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-primary" />}
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed bottom-0 left-1/2 z-40 flex h-[72px] w-full max-w-md -translate-x-1/2 items-start border-t bg-card pb-safe"
      >
        {item("/home", t("home"), Home)}
        {item("/transact", t("transact"), Landmark)}
        <div className="relative flex flex-1 flex-col items-center">
          <button
            type="button"
            onClick={() => setExplore(true)}
            aria-label={t("explore")}
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-fab transition-transform active:scale-95"
          >
            <Compass className="h-6 w-6" />
          </button>
          <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">{t("explore")}</span>
        </div>
        {item("/cards", t("cards"), CreditCard)}
        {item("/more", t("more"), Menu)}
      </nav>
      <ExploreSheet open={explore} onOpenChange={setExplore} />
    </>
  );
}

function ExploreSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useBankMaybe()!.t;
  const close = () => onOpenChange(false);
  const tiles = [
    { label: t("sendToMobile"), icon: Smartphone, link: { to: "/send", search: { type: "mobile" } } },
    { label: t("sendToBank"), icon: Landmark, link: { to: "/send", search: { type: "bank" } } },
    { label: t("ownAccount"), icon: ArrowLeftRight, link: { to: "/send", search: { type: "own" } } },
    { label: t("mpesa"), icon: Wallet, link: { to: "/mpesa", search: { mode: "withdraw" } } },
    { label: t("payBills"), icon: Lightbulb, link: { to: "/bills", search: { tab: "billers" } } },
    { label: t("buyGoods"), icon: Store, link: { to: "/bills", search: { tab: "till" } } },
    { label: t("buyAirtime"), icon: Phone, link: { to: "/airtime" } },
    { label: t("statements"), icon: FileText, link: { to: "/statements" } },
    { label: t("cards"), icon: CreditCard, link: { to: "/cards" } },
    { label: t("settings"), icon: SettingsIcon, link: { to: "/settings" } },
    { label: t("transact"), icon: LayoutGrid, link: { to: "/transact" } },
  ] as const;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{t("explore")}</SheetTitle>
          <SheetDescription>All services in one place</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-4 gap-3 px-4 pb-8">
          {tiles.map((tile) => (
            <Link
              key={tile.label}
              {...(tile.link as { to: "/airtime" })}
              onClick={close}
              className="flex flex-col items-center gap-2 rounded-xl p-2 text-center text-[11px] font-medium text-foreground hover:bg-muted"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                <tile.icon className="h-5 w-5" />
              </span>
              {tile.label}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function IdleWatcher() {
  const bank = useBankMaybe()!;
  const navigate = useNavigate();
  const last = useRef(Date.now());
  const [warn, setWarn] = useState(false);
  const [left, setLeft] = useState(0);
  const warnRef = useRef(false);
  warnRef.current = warn;

  useEffect(() => {
    const bump = () => {
      if (!warnRef.current) last.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const id = window.setInterval(() => {
      const idle = Date.now() - last.current;
      if (idle >= IDLE_LOGOUT_MS) {
        setWarn(false);
        bank.logout();
        navigate({ to: "/", replace: true });
        toast.info("You were logged out after 2 minutes of inactivity");
      } else if (idle >= IDLE_WARN_MS) {
        setWarn(true);
        setLeft(Math.ceil((IDLE_LOGOUT_MS - idle) / 1000));
      }
    }, 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(id);
    };
  }, [bank, navigate]);

  return (
    <AlertDialog open={warn}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you still there?</AlertDialogTitle>
          <AlertDialogDescription>
            For your security you'll be logged out in <b>{left}s</b> due to inactivity.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setWarn(false);
              bank.logout();
              navigate({ to: "/", replace: true });
            }}
          >
            Log out
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              last.current = Date.now();
              setWarn(false);
            }}
          >
            Stay signed in
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
