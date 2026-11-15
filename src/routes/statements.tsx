import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { useBank } from "@/lib/bank/store";
import { formatKES, withRunningBalance } from "@/lib/bank/logic";
import type { Direction } from "@/lib/bank/types";
import { EmptyState, PageHeader } from "@/components/bank/PageHeader";
import { Field, Segmented } from "@/components/bank/Form";
import { TxnRow } from "@/components/bank/TxnRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadStatementPdf } from "@/lib/pdf";

export const Route = createFileRoute("/statements")({
  head: () => ({
    meta: [
      { title: "Statements - Kilele Bank" },
      { name: "description", content: "Filter your demo transactions, view a mini statement and download a PDF." },
      { property: "og:title", content: "Statements - Kilele Bank" },
      { property: "og:description", content: "Demo account statements." },
    ],
  }),
  component: Statements,
});

type View = "full" | "mini";
type TypeFilter = "all" | Direction;

const toKey = (iso: string) => iso.slice(0, 10);

function Statements() {
  const { state, balance, t } = useBank();
  const [accountId, setAccountId] = useState(state.accounts[0]!.id);
  const [view, setView] = useState<View>("full");
  const [type, setType] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  const account = state.accounts.find((a) => a.id === accountId) ?? state.accounts[0]!;
  const all = useMemo(() => withRunningBalance(state, account.id), [state, account.id]);

  const rangeError = from && to && from > to ? "Start date must be before the end date" : null;

  const rows = useMemo(() => {
    if (view === "mini") return all.slice(0, 5);
    const q = query.trim().toLowerCase();
    return all.filter(({ txn }) => {
      if (type !== "all" && txn.direction !== type) return false;
      const day = toKey(txn.date);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (q && !(txn.description.toLowerCase().includes(q) || txn.ref.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [all, view, type, query, from, to]);

  const totals = rows.reduce(
    (acc, { txn }) => {
      if (txn.direction === "credit") acc.in += txn.amount;
      else acc.out += txn.amount + txn.fee;
      return acc;
    },
    { in: 0, out: 0 },
  );

  const filterLabel =
    view === "mini"
      ? "Mini statement (last 5 transactions)"
      : [
          type === "all" ? "All transactions" : type === "credit" ? "Credits only" : "Debits only",
          query.trim() ? `search "${query.trim()}"` : "",
        ]
          .filter(Boolean)
          .join(", ");

  const download = async () => {
    if (rangeError) {
      toast.error(rangeError);
      return;
    }
    setBusy(true);
    try {
      const newest = rows[0]?.txn.date;
      const oldest = rows[rows.length - 1]?.txn.date;
      await downloadStatementPdf({
        accounts: [account],
        rows,
        from: from || (oldest ? toKey(oldest) : toKey(new Date().toISOString())),
        to: to || (newest ? toKey(newest) : toKey(new Date().toISOString())),
        filterLabel,
        balances: { [account.id]: balance(account.id) },
      });
      toast.success("Statement downloaded");
    } catch {
      toast.error("Could not create the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title={t("statements")} />
      <div className="space-y-4 p-4">
        {state.accounts.length > 1 && (
          <Segmented
            value={accountId}
            onChange={setAccountId}
            options={state.accounts.map((a) => ({ value: a.id, label: a.name }))}
          />
        )}

        <div className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">{account.name} balance</p>
          <p className="text-2xl font-bold text-foreground">{formatKES(balance(account.id))}</p>
        </div>

        <Segmented<View>
          value={view}
          onChange={setView}
          options={[
            { value: "full", label: "Full statement" },
            { value: "mini", label: "Mini statement" },
          ]}
        />

        {view === "full" && (
          <div className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
            <Segmented<TypeFilter>
              value={type}
              onChange={setType}
              options={[
                { value: "all", label: "All" },
                { value: "credit", label: "Credits" },
                { value: "debit", label: "Debits" },
              ]}
            />
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search description or reference"
                aria-label="Search transactions"
                className="h-11 rounded-xl bg-background pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" htmlFor="st-from">
                <Input id="st-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-11 rounded-xl bg-background" />
              </Field>
              <Field label="To" htmlFor="st-to">
                <Input id="st-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-11 rounded-xl bg-background" />
              </Field>
            </div>
            {rangeError && <p role="alert" className="text-xs font-medium text-destructive">{rangeError}</p>}
            {(from || to || query || type !== "all") && (
              <button
                type="button"
                className="text-xs font-semibold text-primary"
                onClick={() => {
                  setFrom("");
                  setTo("");
                  setQuery("");
                  setType("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {view === "full" && rows.length > 0 && (
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-card p-3 shadow-card">
              <p className="text-[11px] text-muted-foreground">Money in</p>
              <p className="text-sm font-bold text-success">{formatKES(totals.in)}</p>
            </div>
            <div className="rounded-xl bg-card p-3 shadow-card">
              <p className="text-[11px] text-muted-foreground">Money out</p>
              <p className="text-sm font-bold text-foreground">{formatKES(totals.out)}</p>
            </div>
          </div>
        )}

        <div className="divide-y rounded-2xl bg-card px-3 shadow-card">
          {rows.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title={all.length === 0 ? t("noTransactions") : "No matching transactions"}
              body={all.length === 0 ? undefined : "Try changing the dates, type or search."}
            />
          ) : (
            rows.map(({ txn, balance: bal }) => <TxnRow key={txn.id} txn={txn} balance={bal} />)
          )}
        </div>

        <Button size="xl" className="w-full" onClick={() => void download()} disabled={busy || !!rangeError}>
          <Download /> {busy ? "Preparing PDF..." : "Download PDF"}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">PDF statements are marked as demo documents.</p>
      </div>
    </div>
  );
}
