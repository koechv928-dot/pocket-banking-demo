import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { useBank } from "@/lib/bank/store";
import { HOLDER, OTHER_BANKS } from "@/lib/bank/profile";
import {
  feeFor,
  formatKES,
  formatPhone,
  isValidAccountNumber,
  maskAccount,
  maskPhone,
  normalizePhone,
  parseAmount,
  validateAmount,
} from "@/lib/bank/logic";
import type { BeneficiaryKind, TxnDraft } from "@/lib/bank/types";
import { PageHeader } from "@/components/bank/PageHeader";
import { AccountSelect, AmountField, Field, Segmented, TextField, ToggleRow } from "@/components/bank/Form";
import { TxnFlow } from "@/components/bank/TxnFlow";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SendType = "own" | "internal" | "bank" | "mobile";
const TYPES: SendType[] = ["own", "internal", "bank", "mobile"];

export const Route = createFileRoute("/send")({
  validateSearch: (s: Record<string, unknown>): { type: SendType } => ({
    type: TYPES.includes(s["type"] as SendType) ? (s["type"] as SendType) : "mobile",
  }),
  head: () => ({
    meta: [
      { title: "Send Money - Kilele Bank" },
      { name: "description", content: "Send money to your own account, a Kilele account, another bank or a mobile number." },
      { property: "og:title", content: "Send Money - Kilele Bank" },
      { property: "og:description", content: "Demo money transfers with PIN confirmation and receipts." },
    ],
  }),
  component: SendMoney,
});

const KIND: Record<Exclude<SendType, "own">, BeneficiaryKind> = { internal: "internal", bank: "bank", mobile: "mobile" };

function SendMoney() {
  const { type } = Route.useSearch();
  const navigate = useNavigate({ from: "/send" });
  const { state, balance, t } = useBank();
  const [from, setFrom] = useState(state.accounts[0]!.id);
  const [to, setTo] = useState(state.accounts[1]?.id ?? "");
  const [benId, setBenId] = useState<string | "new">("new");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [bank, setBank] = useState(OTHER_BANKS[0]!);
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [save, setSave] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<TxnDraft | null>(null);

  if (draft) return <TxnFlow draft={draft} onBack={() => setDraft(null)} />;

  const kind = type === "own" ? null : KIND[type];
  const bens = kind ? state.beneficiaries.filter((b) => b.kind === kind) : [];
  const ben = bens.find((b) => b.id === benId);
  const category = type === "own" ? "transfer" : type === "internal" ? "send_internal" : type === "bank" ? "send_bank" : "send_mobile";
  const amt = parseAmount(amount);
  const fee = feeFor(category, amt);

  const switchType = (v: SendType) => {
    setBenId("new");
    setErrors({});
    void navigate({ search: { type: v }, replace: true });
  };

  const submit = () => {
    const e: Record<string, string> = {};
    const amountErr = validateAmount(amt, { available: balance(from), fee });
    if (amountErr) e["amount"] = amountErr;
    let d: TxnDraft | null = null;
    if (type === "own") {
      if (!to || to === from) e["to"] = "Choose a different account to send to";
      const toAcc = state.accounts.find((a) => a.id === to);
      if (toAcc)
        d = {
          title: "Own account transfer",
          accountId: from,
          direction: "debit",
          amount: amt,
          fee,
          category,
          description: `Transfer to ${toAcc.name}`,
          counterparty: toAcc.name,
          counterpartyNumber: toAcc.number,
          toAccountId: toAcc.id,
          details: [
            { label: "To account", value: `${toAcc.name} (${maskAccount(toAcc.number)})` },
            ...(narration ? [{ label: "Narration", value: narration }] : []),
          ],
        };
    } else {
      const recName = (ben?.name ?? name).trim();
      const rawNum = (ben?.number ?? number).trim();
      const recBank = ben?.bank ?? bank;
      if (!ben && recName.length < 2) e["name"] = "Enter the recipient's name";
      let recNum = rawNum.replace(/\s/g, "");
      if (type === "mobile") {
        const p = normalizePhone(rawNum);
        if (!p) e["number"] = "Enter a valid Kenyan mobile number, e.g. 0712 345 678";
        else recNum = p;
      } else if (!isValidAccountNumber(rawNum)) {
        e["number"] = "Account number must be 10-14 digits";
      } else if (state.accounts.some((a) => a.number === recNum)) {
        e["number"] = "That's your own account. Use Own account instead";
      }
      const shown = type === "mobile" ? maskPhone(recNum) : maskAccount(recNum);
      const where = type === "bank" ? ` - ${recBank}` : type === "internal" ? " - Kilele" : ` ${shown}`;
      d = {
        title: type === "mobile" ? "Send to mobile" : type === "bank" ? "Send to other bank" : "Send to Kilele account",
        accountId: from,
        direction: "debit",
        amount: amt,
        fee,
        category,
        description: `Sent to ${recName}${where}`,
        counterparty: recName,
        counterpartyNumber: recNum,
        details: [
          { label: "From", value: HOLDER.fullName },
          { label: "Recipient", value: recName },
          { label: type === "mobile" ? "Mobile number" : "Account number", value: type === "mobile" ? formatPhone(recNum) : recNum },
          ...(type === "bank" ? [{ label: "Bank", value: recBank }] : []),
          ...(narration ? [{ label: "Narration", value: narration }] : []),
        ],
        saveBeneficiary:
          !ben && save && kind ? { name: recName, kind, number: recNum, ...(type === "bank" ? { bank: recBank } : {}) } : undefined,
        processingText: type === "bank" ? "Sending to the other bank..." : undefined,
      };
    }
    setErrors(e);
    if (Object.keys(e).length === 0 && d) setDraft(d);
  };

  return (
    <div>
      <PageHeader title={t("sendMoney")} />
      <div className="space-y-4 p-4">
        <Segmented<SendType>
          value={type}
          onChange={switchType}
          options={[
            { value: "own", label: "Own" },
            { value: "internal", label: "Kilele" },
            { value: "bank", label: "Other bank" },
            { value: "mobile", label: "Mobile" },
          ]}
        />
        <AccountSelect value={from} onChange={setFrom} />

        {type === "own" ? (
          <>
            <AccountSelect value={to} onChange={setTo} label="To account" exclude={from} />
            {errors["to"] && <p className="text-xs font-medium text-destructive">{errors["to"]}</p>}
          </>
        ) : (
          <>
            <Field label="Recipient">
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                <button
                  type="button"
                  onClick={() => setBenId("new")}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium",
                    benId === "new" ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground",
                  )}
                >
                  <UserPlus className="h-4 w-4" /> Add new
                </button>
                {bens.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBenId(b.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium",
                      benId === b.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground",
                    )}
                  >
                    <Users className="h-4 w-4" /> {b.name}
                  </button>
                ))}
              </div>
            </Field>
            {ben ? (
              <div className="rounded-xl border bg-card p-3 text-sm">
                <p className="font-semibold text-foreground">{ben.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ben.kind === "mobile" ? formatPhone(ben.number) : ben.number}
                  {ben.bank ? ` · ${ben.bank}` : ""}
                </p>
                {errors["number"] && <p className="mt-1 text-xs font-medium text-destructive">{errors["number"]}</p>}
              </div>
            ) : (
              <>
                <TextField id="rec-name" label="Recipient name" value={name} onChange={setName} error={errors["name"]} placeholder="e.g. Jane Wanjiru" />
                {type === "bank" && (
                  <Field label="Bank">
                    <Select value={bank} onValueChange={setBank}>
                      <SelectTrigger className="h-12 rounded-xl bg-card" aria-label="Bank">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OTHER_BANKS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
                <TextField
                  id="rec-number"
                  label={type === "mobile" ? t("mobileNumber") : "Account number"}
                  value={number}
                  onChange={setNumber}
                  error={errors["number"]}
                  inputMode={type === "mobile" ? "tel" : "numeric"}
                  placeholder={type === "mobile" ? "07XX XXX XXX" : "10-14 digits"}
                />
                <ToggleRow id="save-ben" label="Save as beneficiary" hint="Find them quickly next time" checked={save} onChange={setSave} />
              </>
            )}
          </>
        )}

        <AmountField value={amount} onChange={setAmount} error={errors["amount"]} hint={amt > 0 ? `Fee: ${formatKES(fee)}` : undefined} />
        <TextField id="narration" label="Narration (optional)" value={narration} onChange={setNarration} maxLength={40} />
        <Button size="xl" className="w-full" onClick={submit}>
          {t("continue")}
        </Button>
      </div>
    </div>
  );
}
