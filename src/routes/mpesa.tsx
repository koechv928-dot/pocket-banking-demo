import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useBank } from "@/lib/bank/store";
import { HOLDER } from "@/lib/bank/profile";
import { feeFor, formatKES, formatPhone, maskPhone, normalizePhone, parseAmount, validateAmount } from "@/lib/bank/logic";
import type { TxnDraft } from "@/lib/bank/types";
import { PageHeader } from "@/components/bank/PageHeader";
import { AccountSelect, AmountField, Segmented, TextField } from "@/components/bank/Form";
import { TxnFlow } from "@/components/bank/TxnFlow";
import { Button } from "@/components/ui/button";

type Mode = "withdraw" | "topup";
type Who = "self" | "other";

export const Route = createFileRoute("/mpesa")({
  validateSearch: (s: Record<string, unknown>): { mode: Mode } => ({
    mode: s["mode"] === "topup" ? "topup" : "withdraw",
  }),
  head: () => ({
    meta: [
      { title: "M-PESA - Kilele Bank" },
      { name: "description", content: "Withdraw to M-PESA or top up your Kilele account from M-PESA (demo)." },
      { property: "og:title", content: "M-PESA - Kilele Bank" },
      { property: "og:description", content: "Demo M-PESA withdraw and top up flows." },
    ],
  }),
  component: Mpesa,
});

function Mpesa() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate({ from: "/mpesa" });
  const { state, balance, t } = useBank();
  const [acc, setAcc] = useState(state.accounts[0]!.id);
  const [who, setWho] = useState<Who>("self");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<TxnDraft | null>(null);

  if (draft) return <TxnFlow draft={draft} onBack={() => setDraft(null)} />;

  const amt = parseAmount(amount);
  const withdraw = mode === "withdraw";
  const fee = withdraw ? feeFor("mpesa_withdraw", amt) : 0;

  const submit = () => {
    const e: Record<string, string> = {};
    const p = who === "self" ? HOLDER.phone : normalizePhone(phone);
    if (!p) e["phone"] = "Enter a valid Safaricom number, e.g. 0712 345 678";
    const err = validateAmount(amt, withdraw ? { available: balance(acc), fee, min: 10, max: 250000 } : { min: 10, max: 250000 });
    if (err) e["amount"] = err;
    setErrors(e);
    if (Object.keys(e).length || !p) return;
    const accObj = state.accounts.find((a) => a.id === acc)!;
    setDraft(
      withdraw
        ? {
            title: "Withdraw to M-PESA",
            accountId: acc,
            direction: "debit",
            amount: amt,
            fee,
            category: "mpesa_withdraw",
            description: `Withdraw to M-PESA ${maskPhone(p)}`,
            counterparty: "M-PESA",
            counterpartyNumber: p,
            details: [{ label: "M-PESA number", value: formatPhone(p) }],
            processingMs: 3000,
            processingText: "Sending money to M-PESA...",
          }
        : {
            title: "Top up from M-PESA",
            accountId: acc,
            direction: "credit",
            amount: amt,
            fee: 0,
            category: "mpesa_topup",
            description: `Top up from M-PESA ${maskPhone(p)}`,
            counterparty: "M-PESA",
            counterpartyNumber: p,
            details: [
              { label: "M-PESA number", value: formatPhone(p) },
              { label: "Credit to", value: accObj.name },
            ],
            stkPhone: formatPhone(p),
            processingMs: 3000,
            processingText: "Confirming M-PESA payment...",
          },
    );
  };

  return (
    <div>
      <PageHeader title={t("mpesa")} />
      <div className="space-y-4 p-4">
        <Segmented<Mode>
          value={mode}
          onChange={(v) => {
            setErrors({});
            void navigate({ search: { mode: v }, replace: true });
          }}
          options={[
            { value: "withdraw", label: "Withdraw to M-PESA" },
            { value: "topup", label: "Top up from M-PESA" },
          ]}
        />
        <AccountSelect value={acc} onChange={setAcc} label={withdraw ? t("fromAccount") : "To account"} />
        <Segmented<Who>
          value={who}
          onChange={setWho}
          options={[
            { value: "self", label: `My number (${maskPhone(HOLDER.phone)})` },
            { value: "other", label: "Other number" },
          ]}
        />
        {who === "other" && (
          <TextField id="mpesa-phone" label="M-PESA number" value={phone} onChange={setPhone} error={errors["phone"]} inputMode="tel" placeholder="07XX XXX XXX" />
        )}
        {who === "self" && errors["phone"] && <p className="text-xs text-destructive">{errors["phone"]}</p>}
        <AmountField
          value={amount}
          onChange={setAmount}
          error={errors["amount"]}
          presets={[500, 1000, 2500, 5000, 10000]}
          hint={withdraw && amt > 0 ? `Fee: ${formatKES(fee)}` : "Min KES 10 · Max KES 250,000"}
        />
        {!withdraw && (
          <p className="rounded-xl bg-secondary p-3 text-xs text-secondary-foreground">
            You'll get a prompt on your phone to enter your M-PESA PIN. Money lands in your account within seconds.
          </p>
        )}
        <Button size="xl" variant={withdraw ? "default" : "mpesa"} className="w-full" onClick={submit}>
          {t("continue")}
        </Button>
      </div>
    </div>
  );
}
