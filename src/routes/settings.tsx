import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Database, KeyRound, LogOut, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useBank } from "@/lib/bank/store";
import { validateNewPin } from "@/lib/bank/logic";
import type { Lang } from "@/lib/bank/types";
import { PageHeader, SectionTitle } from "@/components/bank/PageHeader";
import { Field, Segmented, TextField, ToggleRow } from "@/components/bank/Form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings - Kilele Bank" },
      { name: "description", content: "Change your PIN, language, notifications and display in the Kilele Bank demo app." },
      { property: "og:title", content: "Settings - Kilele Bank" },
      { property: "og:description", content: "Demo app settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, setSettings, resetData, logout, t } = useBank();
  const navigate = useNavigate();
  const [pinOpen, setPinOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <div>
      <PageHeader title={t("settings")} />
      <div className="space-y-3 p-4">
        <SectionTitle>Security</SectionTitle>
        <Button variant="soft" size="xl" className="w-full justify-start" onClick={() => setPinOpen(true)}>
          <KeyRound /> {t("changePin")}
        </Button>

        <SectionTitle>Preferences</SectionTitle>
        <ToggleRow
          id="set-notifs"
          label={t("notifications")}
          hint="Get an alert after every transaction"
          checked={state.settings.notifications}
          onChange={(v) => setSettings({ notifications: v })}
        />
        <ToggleRow
          id="set-dark"
          label={t("darkMode")}
          checked={state.settings.dark}
          onChange={(v) => setSettings({ dark: v })}
        />
        <ToggleRow
          id="set-hide"
          label="Hide balances"
          hint="Mask amounts on the Home screen"
          checked={state.settings.hideBalance}
          onChange={(v) => setSettings({ hideBalance: v })}
        />
        <Field label={t("language")}>
          <Segmented<Lang>
            value={state.settings.lang}
            onChange={(v) => setSettings({ lang: v })}
            options={[
              { value: "en", label: "English" },
              { value: "sw", label: "Kiswahili" },
            ]}
          />
        </Field>

        <SectionTitle>Demo data</SectionTitle>
        <Button asChild variant="soft" size="xl" className="w-full justify-start">
          <Link to="/demo-editor">
            <Database /> {t("demoEditor")}
          </Link>
        </Button>
        <Button variant="outline" size="xl" className="w-full justify-start" onClick={() => setResetOpen(true)}>
          <RotateCcw /> {t("resetData")}
        </Button>
        <p className="text-xs text-muted-foreground">Restores the sample accounts, transactions, merchants and PIN.</p>

        <Button
          variant="destructive"
          size="xl"
          className="mt-4 w-full"
          onClick={() => {
            logout();
            navigate({ to: "/", replace: true });
          }}
        >
          <LogOut /> {t("logout")}
        </Button>
      </div>

      <ChangePinDialog open={pinOpen} onOpenChange={setPinOpen} />

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
            <AlertDialogDescription>
              All transactions, beneficiaries, billers, merchants and your PIN go back to the original demo values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetData();
                toast.success("Demo data restored");
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChangePinDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { verifyPin, changePin, t } = useBank();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const digits = (set: (v: string) => void) => (v: string) => set(v.replace(/\D/g, "").slice(0, 4));

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setErrors({});
  };

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!/^\d{4}$/.test(current)) errs["current"] = "Enter your current 4-digit PIN";
    const newErr = validateNewPin(next, confirm, /^\d{4}$/.test(current) ? current : undefined);
    if (newErr) errs[newErr === "PINs do not match" ? "confirm" : "next"] = newErr;
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const res = verifyPin(current);
    if (!res.ok) {
      setErrors({ current: res.error });
      return;
    }
    changePin(next);
    toast.success("PIN changed successfully");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("changePin")}</DialogTitle>
          <DialogDescription>Choose a 4-digit PIN that is not a simple sequence.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <TextField id="pin-current" label="Current PIN" type="password" inputMode="numeric" maxLength={4} value={current} onChange={digits(setCurrent)} error={errors["current"]} />
          <TextField id="pin-new" label="New PIN" type="password" inputMode="numeric" maxLength={4} value={next} onChange={digits(setNext)} error={errors["next"]} />
          <TextField id="pin-confirm" label="Confirm new PIN" type="password" inputMode="numeric" maxLength={4} value={confirm} onChange={digits(setConfirm)} error={errors["confirm"]} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={submit}>Save PIN</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
