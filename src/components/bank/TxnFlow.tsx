import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck, Smartphone, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBank } from "@/lib/bank/store";
import { formatKES, maskAccount } from "@/lib/bank/logic";
import { HOLDER } from "@/lib/bank/profile";
import type { TxnDraft } from "@/lib/bank/types";
import { PageHeader } from "./PageHeader";
import { PinEntry } from "./PinPad";

type Step = "confirm" | "pin" | "stk-wait" | "stk" | "processing";

export function TxnFlow({ draft, onBack }: { draft: TxnDraft; onBack: () => void }) {
  const [step, setStep] = useState<Step>("confirm");
  const { state, verifyPin, commitTxn, balance } = useBank();
  const navigate = useNavigate();
  const account = state.accounts.find((a) => a.id === draft.accountId)!;
  const total = draft.amount + draft.fee;
  // Keep the latest commit/navigate without restarting the processing timer on re-render.
  const latest = useRef({ commitTxn, navigate, draft });
  latest.current = { commitTxn, navigate, draft };

  useEffect(() => {
    if (step === "stk-wait") {
      const id = window.setTimeout(() => setStep("stk"), 1500);
      return () => window.clearTimeout(id);
    }
    if (step === "processing") {
      const id = window.setTimeout(() => {
        const { commitTxn, navigate, draft } = latest.current;
        const res = commitTxn(draft);
        if (res.ok) {
          toast.success(`${draft.title} successful`, { description: `Ref ${res.txn.ref}` });
          navigate({ to: "/receipt/$id", params: { id: res.txn.id }, replace: true });
        } else {
          toast.error(res.error);
          setStep("confirm");
        }
      }, latest.current.draft.processingMs ?? 1400);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [step]);

  const header = (
    <PageHeader
      title={step === "confirm" ? "Confirm details" : step === "pin" ? "Enter PIN" : draft.title}
      onBack={() => (step === "pin" ? setStep("confirm") : step === "confirm" ? onBack() : undefined)}
      back={step === "confirm" || step === "pin"}
    />
  );

  if (step === "confirm") {
    const insufficient = draft.direction === "debit" && total > balance(account.id);
    return (
      <div>
        {header}
        <div className="space-y-4 p-4">
          <div className="rounded-2xl bg-card p-5 text-center shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{draft.title}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{formatKES(draft.amount)}</p>
            {draft.payTo && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground">
                <Store className="h-4 w-4" /> {draft.payTo}
              </p>
            )}
          </div>
          <dl className="divide-y rounded-2xl bg-card px-4 shadow-card">
            {draft.details.map((d) => (
              <div key={d.label} className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-muted-foreground">{d.label}</dt>
                <dd className="text-right font-medium text-foreground">{d.value}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 py-3 text-sm">
              <dt className="text-muted-foreground">{draft.direction === "credit" ? "To" : "From"}</dt>
              <dd className="text-right font-medium text-foreground">
                {HOLDER.fullName}
                <span className="block text-xs text-muted-foreground">
                  {account.name} ({maskAccount(account.number)})
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3 text-sm">
              <dt className="text-muted-foreground">Transaction fee</dt>
              <dd className="font-medium text-foreground">{formatKES(draft.fee)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3 text-sm">
              <dt className="font-semibold text-foreground">Total</dt>
              <dd className="font-bold text-foreground">{formatKES(total)}</dd>
            </div>
          </dl>
          {insufficient && (
            <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
              Insufficient funds. Available balance is {formatKES(balance(account.id))}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" size="xl" onClick={onBack}>
              Edit
            </Button>
            <Button size="xl" disabled={insufficient} onClick={() => setStep("pin")}>
              Confirm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "pin") {
    return (
      <div>
        {header}
        <div className="space-y-6 px-6 py-6">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Enter your 4-digit PIN to authorise</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatKES(total)}</p>
            {draft.payTo ? (
              <p className="mt-1 text-sm font-semibold text-primary">{draft.payTo}</p>
            ) : (
              <p className="mt-1 text-sm font-medium text-muted-foreground">{draft.description}</p>
            )}
          </div>
          <PinEntry
            onSubmit={(pin) => {
              const res = verifyPin(pin);
              if (res.ok) {
                setStep(draft.stkPhone ? "stk-wait" : "processing");
                return null;
              }
              toast.error(res.error);
              return res.error;
            }}
          />
        </div>
      </div>
    );
  }

  if (step === "stk-wait" || step === "stk") {
    return (
      <div>
        {header}
        <StkPrompt
          ready={step === "stk"}
          phone={draft.stkPhone!}
          amount={draft.amount}
          accountNumber={account.number}
          onCancel={() => {
            toast.error("M-PESA request cancelled on your phone");
            setStep("confirm");
          }}
          onOk={() => setStep("processing")}
        />
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <Loader2 className="h-14 w-14 animate-spin text-primary" />
        <p className="text-lg font-semibold text-foreground">{draft.processingText ?? "Processing your transaction..."}</p>
        <p className="text-sm text-muted-foreground">Please don't close the app.</p>
      </div>
    </div>
  );
}

function StkPrompt({
  ready,
  phone,
  amount,
  accountNumber,
  onCancel,
  onOk,
}: {
  ready: boolean;
  phone: string;
  amount: number;
  accountNumber: string;
  onCancel: () => void;
  onOk: () => void;
}) {
  const [mpin, setMpin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-5 px-6 py-8 text-center">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Smartphone className="h-5 w-5 text-mpesa" />
        {ready ? "Enter your M-PESA PIN on your phone" : `Sending request to ${phone}...`}
      </div>
      <div className="w-64 rounded-[2rem] border-8 border-navy bg-navy p-1 shadow-card">
        <div className="min-h-80 rounded-[1.4rem] bg-card p-4 text-left">
          {!ready ? (
            <div className="flex h-72 flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-mpesa" />
              <p className="text-xs text-muted-foreground">Waiting for phone...</p>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in zoom-in-95">
              <p className="text-xs font-bold tracking-wide text-mpesa">M-PESA</p>
              <p className="text-sm text-foreground">
                Do you want to pay <b>{formatKES(amount)}</b> to <b>KILELE BANK</b> account no. {accountNumber}?
              </p>
              <p className="text-xs text-muted-foreground">Enter M-PESA PIN:</p>
              <Input
                autoFocus
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={mpin}
                aria-label="M-PESA PIN"
                onChange={(e) => {
                  setErr(null);
                  setMpin(e.target.value.replace(/\D/g, ""));
                }}
                className="h-11 text-center text-lg tracking-[0.5em]"
              />
              {err && <p className="text-xs text-destructive">{err}</p>}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="mpesa"
                  onClick={() => (mpin.length === 4 ? onOk() : setErr("Enter your 4-digit M-PESA PIN"))}
                >
                  OK
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="max-w-xs text-xs text-muted-foreground">Demo only: any 4 digits work. Your real M-PESA is never contacted.</p>
    </div>
  );
}
