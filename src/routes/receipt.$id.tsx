import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useBank } from "@/lib/bank/store";
import { HOLDER } from "@/lib/bank/profile";
import { formatDateTime, formatKES, maskAccount } from "@/lib/bank/logic";
import { PageHeader, EmptyState } from "@/components/bank/PageHeader";
import { Button } from "@/components/ui/button";
import { downloadReceiptPdf } from "@/lib/pdf";

export const Route = createFileRoute("/receipt/$id")({
  head: () => ({
    meta: [
      { title: "Receipt - Kilele Bank" },
      { name: "description", content: "Transaction receipt in the Kilele Bank demo app." },
      { property: "og:title", content: "Receipt - Kilele Bank" },
      { property: "og:description", content: "Demo transaction receipt." },
    ],
  }),
  component: Receipt,
});

function Receipt() {
  const { id } = Route.useParams();
  const { state } = useBank();
  const txn = state.transactions.find((x) => x.id === id);
  const acc = txn && state.accounts.find((a) => a.id === txn.accountId);
  if (!txn || !acc) return (<div><PageHeader title="Receipt" /><EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="Transaction not found" /></div>);
  const { date, time } = formatDateTime(txn.date);
  const rows: [string, string][] = [
    ["Description", txn.description],
    [txn.direction === "credit" ? "To" : "From", HOLDER.fullName],
    ["Account", `${acc.name} (${maskAccount(acc.number)})`],
    ...((txn.details ?? []).map((d) => [d.label, d.value]) as [string, string][]),
    ["Fee", formatKES(txn.fee)],
    ["Reference", txn.ref],
    ["Date", `${date} ${time}`],
  ];
  return (
    <div>
      <PageHeader title="Receipt" />
      <div className="space-y-4 p-4">
        <div className="rounded-2xl bg-card p-5 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success animate-pop" />
          <p className="mt-2 text-3xl font-bold text-foreground">{formatKES(txn.amount)}</p>
          <p className="text-sm font-medium text-success">Successful</p>
        </div>
        <dl className="divide-y rounded-2xl bg-card px-4 shadow-card">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="xl" onClick={() => void downloadReceiptPdf(txn, acc)}>Download</Button>
          <Button size="xl" asChild><Link to="/home">Done</Link></Button>
        </div>
      </div>
    </div>
  );
}
