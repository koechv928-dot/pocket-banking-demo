import { useEffect, useRef, useState, type ReactNode } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBank } from "@/lib/bank/store";

/** Seconds left on the shared PIN lockout (0 when unlocked). Ticks every second. */
export function useLockRemaining() {
  const { state } = useBank();
  const lockUntil = state.security.lockUntil;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [lockUntil]);
  return Math.max(0, Math.ceil((lockUntil - now) / 1000));
}

export function PinDots({ length, filled, error, tone = "default" }: { length: number; filled: number; error?: boolean; tone?: "default" | "light" }) {
  return (
    <div className={cn("flex justify-center gap-4", error && "animate-shake")} aria-label={`${filled} of ${length} digits entered`}>
      {Array.from({ length }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-4 w-4 rounded-full border-2 transition-all",
            tone === "light" ? "border-on-photo" : "border-primary",
            i < filled && (tone === "light" ? "scale-110 bg-on-photo" : "scale-110 bg-primary"),
            error && "border-destructive bg-destructive",
          )}
        />
      ))}
    </div>
  );
}

export function Keypad({
  onDigit,
  onDelete,
  leftSlot,
  disabled,
  tone = "default",
}: {
  onDigit: (d: string) => void;
  onDelete: () => void;
  leftSlot?: ReactNode;
  disabled?: boolean;
  tone?: "default" | "light";
}) {
  const key = cn(
    "flex h-16 items-center justify-center rounded-2xl text-2xl font-medium transition-all active:scale-95 disabled:opacity-40",
    tone === "light" ? "text-on-photo hover:bg-photo-glass" : "text-foreground hover:bg-muted",
  );
  return (
    <div className="grid grid-cols-3 gap-2">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
        <button key={d} type="button" className={key} disabled={disabled} onClick={() => onDigit(d)} aria-label={`Digit ${d}`}>
          {d}
        </button>
      ))}
      <div className="flex items-center justify-center">{leftSlot}</div>
      <button type="button" className={key} disabled={disabled} onClick={() => onDigit("0")} aria-label="Digit 0">
        0
      </button>
      <button type="button" className={key} disabled={disabled} onClick={onDelete} aria-label="Delete digit">
        <Delete className="h-6 w-6" />
      </button>
    </div>
  );
}

/**
 * 4-digit PIN entry wired to the shared lockout. Calls onSubmit with the PIN;
 * onSubmit returns an error string to show (or null on success).
 */
export function PinEntry({
  onSubmit,
  leftSlot,
  tone = "default",
  length = 4,
}: {
  onSubmit: (pin: string) => string | null;
  leftSlot?: ReactNode;
  tone?: "default" | "light";
  length?: number;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const remaining = useLockRemaining();
  const locked = remaining > 0;

  const clearTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
  }, []);

  const press = (d: string) => {
    if (pin.length >= length) return;
    setError(null);
    const next = pin + d;
    setPin(next);
    if (next.length === length) {
      const err = onSubmit(next);
      if (err) {
        setError(err);
        setShake((n) => n + 1);
        clearTimer.current = window.setTimeout(() => setPin(""), 350);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div key={shake}>
        <PinDots length={length} filled={pin.length} error={!!error && pin.length === length} tone={tone} />
      </div>
      <p
        role="alert"
        className={cn(
          "min-h-5 text-center text-sm font-medium",
          locked || error ? "text-destructive" : tone === "light" ? "text-on-photo/80" : "text-muted-foreground",
        )}
      >
        {locked ? `Too many wrong attempts. Try again in ${remaining}s` : error ?? ""}
      </p>
      <Keypad
        tone={tone}
        disabled={locked}
        leftSlot={leftSlot}
        onDigit={press}
        onDelete={() => setPin((p) => p.slice(0, -1))}
      />
    </div>
  );
}
