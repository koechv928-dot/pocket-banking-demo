import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { useBank } from "@/lib/bank/store";
import { CARD, HOLDER } from "@/lib/bank/profile";
import { formatKES, parseAmount } from "@/lib/bank/logic";
import { PageHeader, SectionTitle } from "@/components/bank/PageHeader";
import { TextField, ToggleRow } from "@/components/bank/Form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import mountain from "@/assets/mountain-card.jpg";

export const Route = createFileRoute("/cards")({
  head: () => ({
    meta: [
      { title: "Cards - Kilele Bank" },
      { name: "description", content: "View your demo debit card, freeze it and set spending limits." },
      { property: "og:title", content: "Cards - Kilele Bank" },
      { property: "og:description", content: "Demo debit card controls." },
    ],
  }),
  component: Cards,
});

const MAX_LIMIT = 1_000_000;

function Cards() {
  const { state, setCardFrozen, t } = useBank();
  const [reveal, setReveal] = useState(false);
  const [editing, setEditing] = useState(false);
  const { frozen, limits } = state.card;
  const number = reveal ? CARD.number : `•••• •••• •••• ${CARD.number.slice(-4)}`;

  return (
    <div>
      <PageHeader title={t("myCards")} back={false} />
      <div className="space-y-4 p-4">
        <div className="relative overflow-hidden rounded-2xl text-on-photo shadow-card">
          <img src={mountain} alt="" width={1280} height={768} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-photo-overlay" />
          <div className={cn("relative flex aspect-[1.586/1] flex-col justify-between p-5", frozen && "opacity-60 grayscale")}>
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold tracking-wide">Kilele Bank</span>
              <span className="text-xs opacity-90">{CARD.network}</span>
            </div>
            <div>
              <p className="font-mono text-lg tracking-widest" aria-live="polite">{number}</p>
              <div className="mt-3 flex items-end justify-between text-xs">
                <div>
                  <p className="opacity-80">Card holder</p>
                  <p className="text-sm font-semibold tracking-wide">{HOLDER.cardName}</p>
                </div>
                <div className="text-right">
                  <p className="opacity-80">Expires</p>
                  <p className="text-sm font-semibold">{CARD.expiry}</p>
                </div>
                <div className="text-right">
                  <p className="opacity-80">CVV</p>
                  <p className="text-sm font-semibold">{reveal ? CARD.cvv : "•••"}</p>
                </div>
              </div>
            </div>
          </div>
          {frozen && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-semibold text-foreground">
                <Snowflake className="h-4 w-4 text-primary" /> Card frozen
              </span>
            </div>
          )}
        </div>

        <Button variant="soft" size="xl" className="w-full" onClick={() => setReveal((v) => !v)}>
          {reveal ? <EyeOff /> : <Eye />} {reveal ? "Hide card details" : "Show card details"}
        </Button>

        <ToggleRow
          id="freeze"
          label={t("freezeCard")}
          hint={frozen ? "Card is blocked for all payments" : "Block the card temporarily"}
          checked={frozen}
          onChange={(v) => {
            setCardFrozen(v);
            toast.success(v ? "Card frozen" : "Card unfrozen");
          }}
        />

        <SectionTitle action={<button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-primary">{t("edit")}</button>}>
          {t("limits")}
        </SectionTitle>
        <dl className="divide-y rounded-2xl bg-card px-4 shadow-card">
          {(
            [
              ["ATM withdrawal (daily)", limits.atm],
              ["In-store / POS (daily)", limits.pos],
              ["Online (daily)", limits.online],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium text-foreground">{formatKES(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <LimitsSheet open={editing} onOpenChange={setEditing} />
    </div>
  );
}

function LimitsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state, setCardLimits, t } = useBank();
  const [vals, setVals] = useState({ atm: "", pos: "", online: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: "atm" | "pos" | "online") => (v: string) => setVals((p) => ({ ...p, [k]: v.replace(/[^\d]/g, "") }));

  const save = () => {
    const next: Record<string, number> = {};
    const errs: Record<string, string> = {};
    for (const k of ["atm", "pos", "online"] as const) {
      const n = parseAmount(vals[k]);
      if (!Number.isFinite(n) || n <= 0) errs[k] = "Enter a limit greater than 0";
      else if (n > MAX_LIMIT) errs[k] = `Maximum limit is ${formatKES(MAX_LIMIT)}`;
      else next[k] = n;
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setCardLimits({ atm: next["atm"]!, pos: next["pos"]!, online: next["online"]! });
    toast.success("Card limits updated");
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (v) {
          const l = state.card.limits;
          setVals({ atm: String(l.atm), pos: String(l.pos), online: String(l.online) });
          setErrors({});
        }
        onOpenChange(v);
      }}
    >
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{t("limits")}</SheetTitle>
          <SheetDescription>Set daily limits in KES (max {formatKES(MAX_LIMIT)}).</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4">
          <TextField id="lim-atm" label="ATM withdrawal" value={vals.atm} onChange={set("atm")} error={errors["atm"]} inputMode="numeric" />
          <TextField id="lim-pos" label="In-store / POS" value={vals.pos} onChange={set("pos")} error={errors["pos"]} inputMode="numeric" />
          <TextField id="lim-online" label="Online" value={vals.online} onChange={set("online")} error={errors["online"]} inputMode="numeric" />
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <Button variant="outline" size="xl" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button size="xl" onClick={save}>Save limits</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
