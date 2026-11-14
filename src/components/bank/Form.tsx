import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBank } from "@/lib/bank/store";
import { formatKES, maskAccount } from "@/lib/bank/logic";
import { cn } from "@/lib/utils";

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <div className="text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

export const inputClass = "h-12 rounded-xl bg-card text-base";

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  inputMode,
  maxLength,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  hint?: ReactNode;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "tel" | "decimal" | "email";
  maxLength?: number;
  type?: string;
}) {
  return (
    <Field label={label} error={error} hint={hint} htmlFor={id}>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, error && "border-destructive")}
      />
    </Field>
  );
}

export function AmountField({
  value,
  onChange,
  error,
  presets,
  label = "Amount (KES)",
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  presets?: number[];
  label?: string;
  hint?: ReactNode;
}) {
  return (
    <Field label={label} error={error} hint={hint} htmlFor="amount">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
          KES
        </span>
        <Input
          id="amount"
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          className={cn(inputClass, "pl-14 text-lg font-semibold", error && "border-destructive")}
        />
      </div>
      {presets && (
        <div className="flex flex-wrap gap-2 pt-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(String(p))}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                value === String(p)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {p.toLocaleString()}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}

export function AccountSelect({
  value,
  onChange,
  label,
  exclude,
}: {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  exclude?: string;
}) {
  const { state, balance, t } = useBank();
  return (
    <Field label={label ?? t("fromAccount")}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-14 rounded-xl bg-card text-left" aria-label={label ?? t("fromAccount")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {state.accounts
            .filter((a) => a.id !== exclude)
            .map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <span className="flex flex-col">
                  <span className="text-sm font-medium">
                    {a.name} ({maskAccount(a.number)})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("available")}: {formatKES(balance(a.id))}
                  </span>
                </span>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="tablist" className="flex gap-1 rounded-xl bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all",
            value === o.value ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  id,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <SwitchInline id={id} checked={checked} onChange={onChange} />
    </label>
  );
}

function SwitchInline({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <Switch id={id} checked={checked} onCheckedChange={onChange} />;
}
