import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import kileleLogo from "@/assets/kilele-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallCtx {
  canPrompt: boolean;
  installed: boolean;
  dismissed: boolean;
  dismiss: () => void;
  install: () => void;
}

const Ctx = createContext<InstallCtx>({
  canPrompt: false,
  installed: false,
  dismissed: true,
  dismiss: () => undefined,
  install: () => undefined,
});

export function InstallProvider({ children }: { children: ReactNode }) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setDismissed(window.localStorage.getItem("kilele-install-dismissed") === "1");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(() => {
    if (evt) {
      void evt.prompt();
      void evt.userChoice.then((c) => {
        if (c.outcome === "accepted") setInstalled(true);
        setEvt(null);
      });
    } else setHelp(true);
  }, [evt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    window.localStorage.setItem("kilele-install-dismissed", "1");
  }, []);

  return (
    <Ctx.Provider value={{ canPrompt: !!evt, installed, dismissed, dismiss, install }}>
      {children}
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Kilele to your Home Screen</DialogTitle>
            <DialogDescription>Install the app from your browser menu. It then opens full-screen and works offline.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm text-foreground">
            <li className="flex items-start gap-3">
              <Share className="mt-0.5 h-5 w-5 text-primary" />
              <span>
                <b>iPhone (Safari):</b> tap Share, then <b>Add to Home Screen</b>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <SquarePlus className="mt-0.5 h-5 w-5 text-primary" />
              <span>
                <b>Android (Chrome):</b> open the ⋮ menu, then <b>Install app</b> or <b>Add to Home screen</b>.
              </span>
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">Installing works on the published app, not inside the editor preview.</p>
          <Button onClick={() => setHelp(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

export function useInstall() {
  return useContext(Ctx);
}

export function InstallBanner() {
  const { installed, dismissed, dismiss, install } = useInstall();
  if (installed || dismissed) return null;
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card">
      <img src={kileleLogo} alt="" width={44} height={44} className="h-11 w-11 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Install Kilele</p>
        <p className="text-xs text-muted-foreground">Add to Home Screen for quick, offline access</p>
      </div>
      <Button size="sm" onClick={install}>
        <Download /> Install
      </Button>
      <button type="button" aria-label="Dismiss install prompt" onClick={dismiss} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
