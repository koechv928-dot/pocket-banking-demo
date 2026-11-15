import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useBank } from "@/lib/bank/store";
import { categoryLabel, formatDateTime, formatKES, generateRef, parseAmount, sortTxns, uid } from "@/lib/bank/logic";
import type { Direction, Merchant, MerchantType, Txn, TxnCategory } from "@/lib/bank/types";
import { EmptyState, PageHeader } from "@/components/bank/PageHeader";
import { AccountSelect, Field, Segmented, TextField, ToggleRow } from "@/components/bank/Form";
import { TxnIcon } from "@/components/bank/TxnRow";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo-editor")({
  head: () => ({
    meta: [
      { title: "Demo Data Editor - Kilele Bank" },
      { name: "description", content: "Edit demo balances, transactions and merchants in the Kilele Bank demo app." },
      { property: "og:title", content: "Demo Data Editor - Kilele Bank" },
      { property: "og:description", content: "Edit the demo data." },
    ],
  }),
  component: DemoEditor,
});

type Tab = "txns" | "balances" | "merchants";
type Pending = { kind: "txn" | "merchant"; id: string; label: string };

const CATEGORIES = Object.keys({
  transfer: 1, send_internal: 1, send_bank: 1, send_mobile: 1, mpesa_withdraw: 1, mpesa_topup: 1,
  bill: 1, till: 1, airtime: 1, salary: 1, deposit: 1, card: 1, other: 1,
}) as TxnCategory[];

const pad = (n: number) => String(n).padStart(2, "0");
function localParts(iso: string) {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function DemoEditor() {
  const { state, deleteTxn, deleteMerchant, t } = useBank();
  const [tab, setTab] = useState<Tab>("txns");
  const [txnForm, setTxnForm] = useState<{ open: boolean; editing: Txn | null }>({ open: false, editing: null });
  const [merchForm, setMerchForm] = useState<{ open: boolean; editing: Merchant | null }>({ open: false, editing: null });
  const [pending, setPending] = useState<Pending | null>(null);

  const txns = sortTxns(state.transactions);
  const accName = (id: string) => state.accounts.find((a) => a.id === id)?.name ?? "Account";

  return (
    <div>
      <PageHeader title={t("demoEditor")} />
      <div className="space-y-4 p-4">
        <p className="rounded-xl bg-notice p-3 text-xs text-notice-foreground">
          Changes are saved in this browser only and balances recalculate automatically. Exported PDFs and receipts stay marked as demo documents.
        </p>

        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "txns", label: "Transactions" },
            { value: "balances", label: "Balances" },
            { value: "merchants", label: "Merchants" },
          ]}
        />

        {tab === "txns" && (
          <>
            <Button size="xl" className="w-full" onClick={() => setTxnForm({ open: true, editing: null })}>
              <Plus /> Add transaction
            </Button>
            <ul className="divide-y rounded-2xl bg-card px-3 shadow-card">
              {txns.length === 0 && <li><EmptyState icon={<Pencil className="h-6 w-6" />} title={t("noTransactions")} /></li>}
              {txns.map((x) => {
                const { date, time } = formatDateTime(x.date);
                const credit = x.direction === "credit";
                return (
                  <li key={x.id} className="flex items-center gap-2 py-3">
                    <TxnIcon txn={x} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{x.description}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {accName(x.accountId)} · {date} {time}
                      </p>
                    </div>
                    <p className={cn("text-sm font-semibold", credit ? "text-success" : "text-foreground")}>
                      {credit ? "+" : "-"}{formatKES(x.amount, false)}
                    </p>
                    <Button variant="ghost" size="icon" aria-label={`Edit ${x.description}`} onClick={() => setTxnForm({ open: true, editing: x })}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${x.description}`} onClick={() => setPending({ kind: "txn", id: x.id, label: x.description })}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {tab === "balances" && (
          <div className="space-y-3">
            {state.accounts.map((a) => (
              <BalanceCard key={a.id} accountId={a.id} />
            ))}
          </div>
        )}

        {tab === "merchants" && (
          <>
            <Button size="xl" className="w-full" onClick={() => setMerchForm({ open: true, editing: null })}>
              <Plus /> Add merchant
            </Button>
            <ul className="divide-y rounded-2xl bg-card px-3 shadow-card">
              {state.merchants.length === 0 && <li><EmptyState icon={<Store className="h-6 w-6" />} title="No merchants yet" /></li>}
              {state.merchants.map((m) => (
                <li key={m.id} className="flex items-center gap-2 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <Store className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.type === "till" ? "Till" : "Paybill"} {m.number}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Edit ${m.name}`} onClick={() => setMerchForm({ open: true, editing: m })}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${m.name}`} onClick={() => setPending({ kind: "merchant", id: m.id, label: m.name })}>
                    <Trash2 className="text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <TxnSheet state={txnForm} onOpenChange={(open) => setTxnForm((p) => ({ ...p, open }))} />
      <MerchantSheet state={merchForm} onOpenChange={(open) => setMerchForm((p) => ({ ...p, open }))} />

      <AlertDialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pending?.kind === "txn" ? "transaction" : "merchant"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.label}
              {pending?.kind === "txn" ? " will be removed and the balance recalculated." : " will be removed from the directory. Past transactions keep their text."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending?.kind === "txn") deleteTxn(pending.id);
                else if (pending) deleteMerchant(pending.id);
                toast.success("Deleted");
                setPending(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BalanceCard({ accountId }: { accountId: string }) {
  const { state, balance, setOpeningBalance } = useBank();
  const acc = state.accounts.find((a) => a.id === accountId)!;
  const current = balance(accountId);
  const [value, setValue] = useState(String(current));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setValue(String(current)), [current]);

  const save = () => {
    const target = parseAmount(value);
    if (!Number.isFinite(target)) return setError("Enter a valid amount");
    if (target < 0 || target > 1_000_000_000) return setError("Enter an amount between 0 and 1,000,000,000");
    // Keep every transaction; shift the opening balance so the total matches.
    const opening = Math.round((acc.openingBalance + (target - current)) * 100) / 100;
    setOpeningBalance(accountId, opening);
    setError(null);
    toast.success(`${acc.name} balance set to ${formatKES(target)}`);
  };

  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-foreground">{acc.name}</p>
        <p className="text-xs text-muted-foreground">Now {formatKES(current)}</p>
      </div>
      <TextField
        id={`bal-${accountId}`}
        label="Set current balance (KES)"
        value={value}
        onChange={(v) => setValue(v.replace(/[^\d.,]/g, ""))}
        error={error}
        inputMode="decimal"
        hint={`Opening balance is ${formatKES(acc.openingBalance)}; it adjusts so your transactions stay intact.`}
      />
      <Button className="w-full" size="xl" onClick={save}>Save balance</Button>
    </div>
  );
}

function TxnSheet({ state, onOpenChange }: { state: { open: boolean; editing: Txn | null }; onOpenChange: (v: boolean) => void }) {
  const { state: bank, upsertTxn } = useBank();
  const { open, editing } = state;
  const [accountId, setAccountId] = useState("");
  const [direction, setDirection] = useState<Direction>("debit");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TxnCategory>("other");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [ref, setRef] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      const p = localParts(editing.date);
      setAccountId(editing.accountId);
      setDirection(editing.direction);
      setAmount(String(editing.amount));
      setFee(editing.fee ? String(editing.fee) : "");
      setDescription(editing.description);
      setCategory(editing.category);
      setDate(p.date);
      setTime(p.time);
      setRef(editing.ref);
    } else {
      const p = localParts(new Date().toISOString());
      setAccountId(bank.accounts[0]!.id);
      setDirection("debit");
      setAmount("");
      setFee("");
      setDescription("");
      setCategory("other");
      setDate(p.date);
      setTime(p.time);
      setRef("");
    }
  }, [open, editing, bank.accounts]);

  const save = () => {
    const errs: Record<string, string> = {};
    const amt = parseAmount(amount);
    const feeN = fee.trim() === "" ? 0 : parseAmount(fee);
    const when = new Date(`${date}T${time}`);
    const refClean = ref.trim().toUpperCase();
    if (!Number.isFinite(amt) || amt <= 0) errs["amount"] = "Enter an amount greater than 0";
    if (!Number.isFinite(feeN) || feeN < 0) errs["fee"] = "Fee must be 0 or more";
    if (description.trim().length < 2) errs["description"] = "Enter a description";
    else if (description.trim().length > 80) errs["description"] = "Description must be 80 characters or less";
    if (!date || !time || Number.isNaN(when.getTime())) errs["date"] = "Enter a valid date and time";
    if (refClean && !/^[A-Z0-9]{4,20}$/.test(refClean)) errs["ref"] = "Reference must be 4-20 letters or digits";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const base: Txn = editing ?? { id: uid(), ref: "", accountId, direction, amount: amt, fee: 0, description: "", category, date: "" };
    upsertTxn({
      ...base,
      accountId,
      direction,
      amount: amt,
      fee: direction === "debit" ? feeN : 0,
      description: description.trim(),
      category,
      ref: refClean || (editing ? editing.ref : generateRef()),
      date: when.toISOString(),
    });
    toast.success(editing ? "Transaction updated" : "Transaction added");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit transaction" : "Add transaction"}</SheetTitle>
          <SheetDescription>Balances update as soon as you save.</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4">
          <AccountSelect value={accountId} onChange={setAccountId} label="Account" />
          <Segmented<Direction>
            value={direction}
            onChange={setDirection}
            options={[
              { value: "debit", label: "Debit (money out)" },
              { value: "credit", label: "Credit (money in)" },
            ]}
          />
          <TextField id="tx-amount" label="Amount (KES)" value={amount} onChange={(v) => setAmount(v.replace(/[^\d.,]/g, ""))} error={errors["amount"]} inputMode="decimal" />
          {direction === "debit" && (
            <TextField id="tx-fee" label="Fee (KES, optional)" value={fee} onChange={(v) => setFee(v.replace(/[^\d.,]/g, ""))} error={errors["fee"]} inputMode="decimal" />
          )}
          <TextField id="tx-desc" label="Description" value={description} onChange={setDescription} error={errors["description"]} />
          <Field label="Category">
            <Select value={category} onValueChange={(v) => setCategory(v as TxnCategory)}>
              <SelectTrigger className="h-12 rounded-xl bg-card" aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{categoryLabel(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <TextField id="tx-date" label="Date" type="date" value={date} onChange={setDate} error={errors["date"]} />
            <TextField id="tx-time" label="Time" type="time" value={time} onChange={setTime} />
          </div>
          <TextField id="tx-ref" label="Reference" value={ref} onChange={setRef} error={errors["ref"]} placeholder="Leave blank to generate" />
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <Button variant="outline" size="xl" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="xl" onClick={save}>{editing ? "Save changes" : "Add"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MerchantSheet({ state, onOpenChange }: { state: { open: boolean; editing: Merchant | null }; onOpenChange: (v: boolean) => void }) {
  const { addMerchant, updateMerchant } = useBank();
  const { open, editing } = state;
  const [type, setType] = useState<MerchantType>("till");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [updatePast, setUpdatePast] = useState(false);
  const [errors, setErrors] = useState<{ number?: string; name?: string }>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setUpdatePast(false);
    setType(editing?.type ?? "till");
    setNumber(editing?.number ?? "");
    setName(editing?.name ?? "");
  }, [open, editing]);

  const save = () => {
    const input = { number, name, type };
    const res = editing ? updateMerchant(editing.id, input, updatePast) : addMerchant(input);
    if (!res.ok) return setErrors(res.errors);
    toast.success(editing ? "Merchant updated" : "Merchant added");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit merchant" : "Add merchant"}</SheetTitle>
          <SheetDescription>Pay to a till or paybill number and this name is shown on the confirmation and receipt.</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4">
          <Segmented<MerchantType>
            value={type}
            onChange={setType}
            options={[
              { value: "till", label: "Till" },
              { value: "paybill", label: "Paybill" },
            ]}
          />
          <TextField id="m-number" label={`${type === "till" ? "Till" : "Paybill"} number`} value={number} onChange={(v) => setNumber(v.replace(/\D/g, ""))} error={errors.number} inputMode="numeric" maxLength={7} />
          <TextField id="m-name" label="Merchant name" value={name} onChange={setName} error={errors.name} maxLength={40} />
          {editing && (
            <ToggleRow
              id="m-past"
              label="Update past transactions"
              hint="Rewrite old entries with the new number and name"
              checked={updatePast}
              onChange={setUpdatePast}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <Button variant="outline" size="xl" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="xl" onClick={save}>{editing ? "Save changes" : "Add"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
