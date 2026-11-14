import { Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  Banknote,
  CreditCard,
  Landmark,
  Lightbulb,
  Phone,
  Smartphone,
  Store,
  Wallet,
} from "lucide-react";
import type { Txn, TxnCategory } from "@/lib/bank/types";
import { formatDateTime, formatKES } from "@/lib/bank/logic";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ICONS: Record<TxnCategory, typeof Wallet> = {
  transfer: ArrowLeftRight,
  send_internal: Landmark,
  send_bank: Landmark,
  send_mobile: Smartphone,
  mpesa_withdraw: Smartphone,
  mpesa_topup: Smartphone,
  bill: Lightbulb,
  till: Store,
  airtime: Phone,
  salary: Banknote,
  deposit: ArrowDownLeft,
  card: CreditCard,
  other: Wallet,
};

export function TxnIcon({ txn }: { txn: Pick<Txn, "category" | "direction"> }) {
  const Icon = ICONS[txn.category];
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        txn.direction === "credit" ? "bg-success/15 text-success" : "bg-secondary text-primary",
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function TxnRow({ txn, balance, hideAmount }: { txn: Txn; balance?: number; hideAmount?: boolean }) {
  const { date, time } = formatDateTime(txn.date);
  const credit = txn.direction === "credit";
  return (
    <Link
      to="/receipt/$id"
      params={{ id: txn.id }}
      className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-muted/60"
    >
      <TxnIcon txn={txn} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{txn.description}</p>
        <p className="text-xs text-muted-foreground">
          {date} · {time} · {txn.ref}
        </p>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-semibold", credit ? "text-success" : "text-foreground")}>
          {hideAmount ? "KES ••••" : `${credit ? "+" : "-"}${formatKES(txn.amount + (credit ? 0 : txn.fee))}`}
        </p>
        {balance !== undefined && !hideAmount && (
          <p className="text-[11px] text-muted-foreground">Bal {formatKES(balance, false)}</p>
        )}
      </div>
    </Link>
  );
}

export function TxnSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-1" aria-label="Loading transactions">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-1 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
