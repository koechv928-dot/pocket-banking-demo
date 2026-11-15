import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useBank } from "@/lib/bank/store";
import { HOLDER } from "@/lib/bank/profile";
import { formatPhone, maskPhone, normalizePhone, parseAmount, validateAmount } from "@/lib/bank/logic";
import type { TxnDraft } from "@/lib/bank/types";
import { PageHeader } from "@/components/bank/PageHeader";
import { AccountSelect, AmountField, Field, Segmented, TextField } from "@/components/bank/Form";
import { TxnFlow } from "@/components/bank/TxnFlow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/airtime")({
  head: () => ({
    meta: [
      { title: "Buy Airtime - Kilele Bank" },
      { name: "description", content: "Buy Safaricom, Airtel or Telkom airtime for yourself or another number (demo)." },
      { property: "og:title", content: "Buy Airtime - Kilele Bank" },
      { property: "og:description", content: "Demo airtime purchase for any Kenyan network." },
    ],
  }),
  component: Airtime,
});

const NETWORKS = [
  { id: "Safaricom", cls: "bg-mpesa text-success-foreground" },
  { id: "Airtel", cls: "bg-destructive text-destructive-foreground" },
  { id: "Telkom", cls: "bg-steel text-on-photo" },
] as const;

function Airtime() {
  const { state, balance, t } = useBank();
  const [acc, setAcc] = useState(state.accounts[0]!.id);
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]["id"]>("Safaricom");
  const [who, setWho] = useState<"self" | "other">("self");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<TxnDraft | null>(null);

  if (draft) return <TxnFlow draft={draft} onBack={() => setDraft(null)} />;

  const submit = () => {
    const e: Record<string, string> = {};
    const p = who === "self" ? HOLDER.phone : normalizePhone(phone);
    if (!p) e["phone"] = "Enter a valid mobile number, e.g. 0733 123 456";
    const amt = parseAmount(amount);
    const err = validateAmount(amt, { available: balance(acc), min: 10, max: 10000 });
    if (err) e["amount"] = err;
    setErrors(e);
    if (Object.keys(e).length || !p) return;
    setDraft({
      title: "Buy airtime",
      accountId: acc,
      direction: "debit",
      amount: amt,
      fee: 0,
      category: "airtime",
      description: `Airtime - ${network} ${maskPhone(p)}`,
      counterparty: network,
      counterpartyNumber: p,
      details: [
        { label: "Network", value: network },
        { label: "Phone number", value: `${formatPhone(p)}${who === "self" ? " (my number)" : ""}` },
      ],
      processingText: "Buying airtime...",
    });
  };

  return (
    <div>
      <PageHeader title={t("buyAirtime")} />
      <div className="space-y-4 p-4">
        <Field label="Network">
          <div className="grid grid-cols-3 gap-2">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                type="button"
                aria-pressed={network === n.id}
                onClick={() => setNetwork(n.id)}
                className={cn("flex flex-col items-center gap-2 rounded-xl border-2 bg-card p-3 text-xs font-semibold text-foreground", network === n.id ? "border-primary" : "border-transparent")}
              >
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold", n.cls)}>{n.id[0]}</span>
                {n.id}
              </button>
            ))}
          </div>
        </Field>
        <Segmented
          value={who}
          onChange={setWho}
          options={[
            { value: "self", label: "My number" },
            { value: "other", label: "Other number" },
          ]}
        />
        {who === "self" ? (
          <p className="rounded-xl border bg-card px-4 py-3 text-sm text-foreground">{formatPhone(HOLDER.phone)}</p>
        ) : (
          <TextField id="air-phone" label={t("mobileNumber")} value={phone} onChange={setPhone} error={errors["phone"]} inputMode="tel" placeholder="07XX XXX XXX" />
        )}
        <AccountSelect value={acc} onChange={setAcc} />
        <AmountField value={amount} onChange={setAmount} error={errors["amount"]} presets={[50, 100, 250, 500, 1000]} hint="Min KES 10 · Max KES 10,000" />
        <Button size="xl" className="w-full" onClick={submit}>
          {t("continue")}
        </Button>
      </div>
    </div>
  );
}
