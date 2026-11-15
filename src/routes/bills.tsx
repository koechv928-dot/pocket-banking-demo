import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Lightbulb, Store, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useBank } from "@/lib/bank/store";
import { isValidMerchantNumber, lookupMerchant, parseAmount, payToLabel, validateAmount } from "@/lib/bank/logic";
import type { Biller, TxnDraft } from "@/lib/bank/types";
import { PageHeader, EmptyState } from "@/components/bank/PageHeader";
import { AccountSelect, AmountField, Segmented, TextField, ToggleRow } from "@/components/bank/Form";
import { TxnFlow } from "@/components/bank/TxnFlow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "billers" | "paybill" | "till";

export const Route = createFileRoute("/bills")({
  validateSearch: (s: Record<string, unknown>): { tab: Tab } => ({
    tab: s["tab"] === "till" ? "till" : s["tab"] === "paybill" ? "paybill" : "billers",
  }),
  head: () => ({
    meta: [
      { title: "Pay Bills - Kilele Bank" },
      { name: "description", content: "Pay saved billers, any paybill or a Safaricom till number (demo)." },
      { property: "og:title", content: "Pay Bills - Kilele Bank" },
      { property: "og:description", content: "Demo bill payments and Buy Goods with merchant lookup." },
    ],
  }),
  component: Bills,
});

function Bills() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: "/bills" });
  const { t } = useBank();
  const [draft, setDraft] = useState<TxnDraft | null>(null);
  if (draft) return <TxnFlow draft={draft} onBack={() => setDraft(null)} />;
  return (
    <div>
      <PageHeader title={tab === "till" ? t("buyGoods") : t("payBills")} />
      <div className="space-y-4 p-4">
        <Segmented<Tab>
          value={tab}
          onChange={(v) => void navigate({ search: { tab: v }, replace: true })}
          options={[
            { value: "billers", label: "My billers" },
            { value: "paybill", label: "Paybill" },
            { value: "till", label: "Safaricom Till" },
          ]}
        />
        {tab === "billers" && <SavedBillers onDraft={setDraft} />}
        {tab === "paybill" && <PaybillForm onDraft={setDraft} />}
        {tab === "till" && <TillForm onDraft={setDraft} />}
      </div>
    </div>
  );
}

function SavedBillers({ onDraft }: { onDraft: (d: TxnDraft) => void }) {
  const { state, deleteBiller } = useBank();
  const [picked, setPicked] = useState<Biller | null>(null);
  if (picked) return <PaybillForm onDraft={onDraft} preset={picked} onCancel={() => setPicked(null)} />;
  if (state.billers.length === 0)
    return <EmptyState icon={<Lightbulb className="h-6 w-6" />} title="No saved billers" body="Pay a paybill and turn on 'Save biller' to see it here." />;
  return (
    <ul className="divide-y rounded-2xl bg-card px-2 shadow-card">
      {state.billers.map((b) => (
        <li key={b.id} className="flex items-center gap-3 py-2">
          <button type="button" onClick={() => setPicked(b)} className="flex flex-1 items-center gap-3 rounded-xl p-2 text-left hover:bg-muted">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20 text-sm font-bold text-warning">{b.name.slice(0, 2).toUpperCase()}</span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{b.name}</span>
              <span className="block text-xs text-muted-foreground">
                Paybill {b.paybill} · Acc {b.accountNumber}
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label={`Delete ${b.name}`}
            onClick={() => {
              deleteBiller(b.id);
              toast.success(`${b.name} removed`);
            }}
            className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function PaybillForm({ onDraft, preset, onCancel }: { onDraft: (d: TxnDraft) => void; preset?: Biller; onCancel?: () => void }) {
  const { state, balance, t } = useBank();
  const [acc, setAcc] = useState(state.accounts[0]!.id);
  const [paybill, setPaybill] = useState(preset?.paybill ?? "");
  const [accountNo, setAccountNo] = useState(preset?.accountNumber ?? "");
  const [amount, setAmount] = useState("");
  const [save, setSave] = useState(false);
  const [billerName, setBillerName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const merchant = isValidMerchantNumber(paybill) ? lookupMerchant(state.merchants, paybill, "paybill") : undefined;
  const name = preset?.name ?? merchant?.name ?? billerName;

  const submit = () => {
    const e: Record<string, string> = {};
    if (!isValidMerchantNumber(paybill)) e["paybill"] = "Paybill number must be 5-7 digits";
    if (accountNo.trim().length < 2) e["accountNo"] = "Enter the account number for this bill";
    if (!merchant && !preset && billerName.trim().length < 2) e["name"] = "Unregistered paybill - enter the business name";
    const amt = parseAmount(amount);
    const err = validateAmount(amt, { available: balance(acc), max: 500000 });
    if (err) e["amount"] = err;
    setErrors(e);
    if (Object.keys(e).length) return;
    const m = { name: name.trim(), number: paybill.trim(), type: "paybill" as const };
    const label = payToLabel(m);
    onDraft({
      title: "Pay bill",
      accountId: acc,
      direction: "debit",
      amount: amt,
      fee: 0,
      category: "bill",
      description: label,
      payTo: label,
      counterparty: m.name,
      counterpartyNumber: m.number,
      merchantId: merchant?.id,
      merchantType: "paybill",
      newMerchant: merchant ? undefined : m,
      details: [
        { label: "Paybill", value: m.number },
        { label: "Business", value: m.name },
        { label: "Account number", value: accountNo.trim() },
      ],
      saveBiller: !preset && save ? { name: m.name, paybill: m.number, accountNumber: accountNo.trim() } : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {preset && (
        <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
          <p className="text-sm font-semibold text-secondary-foreground">{preset.name}</p>
          <button type="button" className="text-xs font-semibold text-primary" onClick={onCancel}>
            Change
          </button>
        </div>
      )}
      <AccountSelect value={acc} onChange={setAcc} />
      <TextField id="paybill" label="Paybill number" value={paybill} onChange={(v) => setPaybill(v.replace(/\D/g, ""))} error={errors["paybill"]} inputMode="numeric" maxLength={7} placeholder="e.g. 888880" />
      {isValidMerchantNumber(paybill) && !preset && (merchant ? <PayToBadge label={payToLabel(merchant)} /> : (
        <TextField id="biller-name" label="Unregistered paybill - enter business name" value={billerName} onChange={setBillerName} error={errors["name"]} />
      ))}
      <TextField id="bill-acc" label="Account number" value={accountNo} onChange={setAccountNo} error={errors["accountNo"]} placeholder="Meter / account no." />
      <AmountField value={amount} onChange={setAmount} error={errors["amount"]} />
      {!preset && <ToggleRow id="save-biller" label="Save biller" hint="Show it in My billers" checked={save} onChange={setSave} />}
      <Button size="xl" className="w-full" onClick={submit}>
        {t("continue")}
      </Button>
    </div>
  );
}

function PayToBadge({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-2.5 text-sm font-semibold text-foreground">
      <CheckCircle2 className="h-4 w-4 text-success" /> {label}
    </p>
  );
}

function TillForm({ onDraft }: { onDraft: (d: TxnDraft) => void }) {
  const { state, balance, t } = useBank();
  const [acc, setAcc] = useState(state.accounts[0]!.id);
  const [till, setTill] = useState("");
  const [newName, setNewName] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const valid = isValidMerchantNumber(till);
  const merchant = valid ? lookupMerchant(state.merchants, till, "till") : undefined;

  const submit = () => {
    const e: Record<string, string> = {};
    if (!valid) e["till"] = "Till number must be 5-7 digits";
    else if (!merchant) {
      if (newName.trim().length < 2) e["name"] = "Unregistered merchant - enter name";
      else if (newName.trim().length > 40) e["name"] = "Name must be 40 characters or less";
    }
    const amt = parseAmount(amount);
    const err = validateAmount(amt, { available: balance(acc), max: 250000 });
    if (err) e["amount"] = err;
    setErrors(e);
    if (Object.keys(e).length) return;
    const m = merchant ?? { name: newName.trim(), number: till.trim(), type: "till" as const };
    const label = payToLabel(m);
    onDraft({
      title: "Buy goods",
      accountId: acc,
      direction: "debit",
      amount: amt,
      fee: 0,
      category: "till",
      description: label,
      payTo: label,
      counterparty: m.name,
      counterpartyNumber: m.number,
      merchantId: merchant?.id,
      merchantType: "till",
      newMerchant: merchant ? undefined : { name: m.name, number: m.number, type: "till" },
      details: [
        { label: "Till number", value: m.number },
        { label: "Merchant", value: m.name.toUpperCase() },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <AccountSelect value={acc} onChange={setAcc} />
      <TextField id="till" label="Till number" value={till} onChange={(v) => setTill(v.replace(/\D/g, ""))} error={errors["till"]} inputMode="numeric" maxLength={7} placeholder="e.g. 123456" />
      {valid &&
        (merchant ? (
          <PayToBadge label={payToLabel(merchant)} />
        ) : (
          <div className="space-y-2">
            <p className={cn("flex items-center gap-2 rounded-xl bg-warning/15 px-3 py-2.5 text-sm font-semibold text-foreground")}>
              <AlertTriangle className="h-4 w-4 text-warning" /> Unregistered merchant - enter name
            </p>
            <TextField id="merchant-name" label="Merchant name" value={newName} onChange={setNewName} error={errors["name"]} placeholder="Saved to your merchant directory" />
          </div>
        ))}
      <AmountField value={amount} onChange={setAmount} error={errors["amount"]} />
      <Button size="xl" className="w-full" onClick={submit}>
        <Store /> {t("continue")}
      </Button>
    </div>
  );
}
