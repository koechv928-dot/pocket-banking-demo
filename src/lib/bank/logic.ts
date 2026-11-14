import type {
  Account,
  BankState,
  Merchant,
  MerchantType,
  Txn,
  TxnCategory,
} from "./types";
import { LOCK_MS, MAX_PIN_ATTEMPTS } from "./profile";

/* ---------- formatting ---------- */

const kes = new Intl.NumberFormat("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatKES(n: number, withCurrency = true) {
  const s = kes.format(Math.abs(n));
  const sign = n < 0 ? "-" : "";
  return withCurrency ? `KES ${sign}${s}` : `${sign}${s}`;
}

export function maskAccount(num: string) {
  const d = num.replace(/\D/g, "");
  if (d.length < 7) return d;
  return `${d.slice(0, 3)}****${d.slice(-3)}`;
}

export function maskPhone(phone: string) {
  const p = normalizePhone(phone) ?? phone;
  return `${p.slice(0, 4)}***${p.slice(-3)}`;
}

export function formatPhone(phone: string) {
  const p = normalizePhone(phone) ?? phone;
  return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}`;
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

/* ---------- balances ---------- */

export function txnEffect(t: Pick<Txn, "direction" | "amount" | "fee">) {
  return t.direction === "credit" ? t.amount : -(t.amount + (t.fee || 0));
}

export function balanceOf(state: Pick<BankState, "accounts" | "transactions">, accountId: string) {
  const acc = state.accounts.find((a) => a.id === accountId);
  if (!acc) return 0;
  const total = state.transactions
    .filter((t) => t.accountId === accountId)
    .reduce((sum, t) => sum + txnEffect(t), acc.openingBalance);
  return Math.round(total * 100) / 100;
}

export function sortTxns(txns: Txn[]) {
  return [...txns].sort((a, b) => b.date.localeCompare(a.date));
}

/** Newest first, each with the account balance right after it posted. */
export function withRunningBalance(state: Pick<BankState, "accounts" | "transactions">, accountId: string) {
  const acc = state.accounts.find((a) => a.id === accountId);
  if (!acc) return [];
  const asc = state.transactions
    .filter((t) => t.accountId === accountId)
    .sort((a, b) => a.date.localeCompare(b.date));
  let bal = acc.openingBalance;
  const rows = asc.map((t) => {
    bal = Math.round((bal + txnEffect(t)) * 100) / 100;
    return { txn: t, balance: bal };
  });
  return rows.reverse();
}

/* ---------- validation ---------- */

export function parseAmount(input: string | number): number {
  if (typeof input === "number") return input;
  const n = Number(input.replace(/,/g, "").trim());
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

export function validateAmount(
  amount: number,
  opts: { available?: number; fee?: number; min?: number; max?: number } = {},
): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount greater than 0";
  if (opts.min !== undefined && amount < opts.min) return `Minimum amount is ${formatKES(opts.min)}`;
  if (opts.max !== undefined && amount > opts.max) return `Maximum amount is ${formatKES(opts.max)}`;
  if (opts.available !== undefined && amount + (opts.fee ?? 0) > opts.available) {
    return `Insufficient funds. Available balance is ${formatKES(opts.available)}`;
  }
  return null;
}

/** Returns 07XXXXXXXX / 01XXXXXXXX, or null if not a valid Kenyan mobile number. */
export function normalizePhone(input: string): string | null {
  const d = input.replace(/[\s-]/g, "");
  const m = d.match(/^(?:\+?254|0)?([17]\d{8})$/);
  return m ? `0${m[1]}` : null;
}

export function isValidPhone(input: string) {
  return normalizePhone(input) !== null;
}

export function isValidAccountNumber(input: string) {
  return /^\d{10,14}$/.test(input.replace(/\s/g, ""));
}

export function isValidMerchantNumber(input: string) {
  return /^\d{5,7}$/.test(input.trim());
}

export function validateMerchant(
  merchants: Merchant[],
  draft: { number: string; name: string; type: MerchantType },
  editingId?: string,
): { number?: string; name?: string } {
  const errors: { number?: string; name?: string } = {};
  const number = draft.number.trim();
  if (!isValidMerchantNumber(number)) {
    errors.number = `${draft.type === "till" ? "Till" : "Paybill"} number must be 5-7 digits`;
  } else if (merchants.some((m) => m.number === number && m.id !== editingId)) {
    errors.number = `Number ${number} is already in the directory`;
  }
  const name = draft.name.trim();
  if (name.length < 2) errors.name = "Enter a merchant name";
  else if (name.length > 40) errors.name = "Name must be 40 characters or less";
  return errors;
}

export function lookupMerchant(merchants: Merchant[], number: string, type?: MerchantType) {
  return merchants.find((m) => m.number === number.trim() && (!type || m.type === type));
}

export function payToLabel(m: { name: string; number: string; type: MerchantType }) {
  return `Pay to: ${m.name.toUpperCase()}, ${m.type === "till" ? "Till" : "Paybill"} ${m.number}`;
}

/** Applies a merchant edit; optionally rewrites past transactions that used it. */
export function applyMerchantEdit(
  state: BankState,
  id: string,
  patch: { number: string; name: string; type: MerchantType },
  updatePast: boolean,
): BankState {
  const merchants = state.merchants.map((m) =>
    m.id === id ? { ...m, number: patch.number.trim(), name: patch.name.trim(), type: patch.type } : m,
  );
  if (!updatePast) return { ...state, merchants };
  const label = payToLabel({ ...patch, name: patch.name.trim(), number: patch.number.trim() });
  const transactions = state.transactions.map((t) =>
    t.merchantId === id
      ? {
          ...t,
          counterparty: patch.name.trim(),
          counterpartyNumber: patch.number.trim(),
          merchantType: patch.type,
          description: label,
        }
      : t,
  );
  return { ...state, merchants, transactions };
}

/* ---------- fees ---------- */

export function feeFor(category: TxnCategory, amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  switch (category) {
    case "send_mobile":
    case "mpesa_withdraw":
      if (amount <= 100) return 0;
      if (amount <= 1000) return 13;
      if (amount <= 5000) return 33;
      return 55;
    case "send_bank":
      return amount <= 1000 ? 25 : 55;
    default:
      return 0;
  }
}

/* ---------- PIN / lockout ---------- */

export type PinResult =
  | { ok: true; security: BankState["security"] }
  | { ok: false; locked: boolean; error: string; security: BankState["security"]; remainingMs?: number };

export function checkPin(
  security: BankState["security"],
  actualPin: string,
  entered: string,
  now: number,
): PinResult {
  if (security.lockUntil > now) {
    const remainingMs = security.lockUntil - now;
    return {
      ok: false,
      locked: true,
      remainingMs,
      error: `Too many wrong attempts. Try again in ${Math.ceil(remainingMs / 1000)}s`,
      security,
    };
  }
  if (entered === actualPin) return { ok: true, security: { failed: 0, lockUntil: 0 } };
  const failed = security.failed + 1;
  if (failed >= MAX_PIN_ATTEMPTS) {
    return {
      ok: false,
      locked: true,
      remainingMs: LOCK_MS,
      error: "Wrong PIN. Too many attempts - locked for 30 seconds",
      security: { failed: 0, lockUntil: now + LOCK_MS },
    };
  }
  const left = MAX_PIN_ATTEMPTS - failed;
  return {
    ok: false,
    locked: false,
    error: `Wrong PIN. ${left} attempt${left === 1 ? "" : "s"} left`,
    security: { failed, lockUntil: 0 },
  };
}

export function validateNewPin(newPin: string, confirm: string, currentPin?: string): string | null {
  if (!/^\d{4}$/.test(newPin)) return "PIN must be exactly 4 digits";
  if (/^(\d)\1{3}$/.test(newPin)) return "PIN cannot be 4 identical digits";
  if (["0123", "1234", "2345", "3456", "4567", "5678", "6789", "9876", "8765", "7654", "6543", "5432", "4321", "3210"].includes(newPin))
    return "PIN cannot be a simple sequence";
  if (currentPin !== undefined && newPin === currentPin) return "New PIN must be different from your current PIN";
  if (newPin !== confirm) return "PINs do not match";
  return null;
}

/* ---------- ids ---------- */

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
export function generateRef(prefix = "KLB") {
  let s = "";
  for (let i = 0; i < 7; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return `${prefix}${s}`;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function accountLabel(a: Account) {
  return `${a.name} (${maskAccount(a.number)})`;
}

export function categoryLabel(c: TxnCategory) {
  const map: Record<TxnCategory, string> = {
    transfer: "Own transfer",
    send_internal: "Kilele transfer",
    send_bank: "Bank transfer",
    send_mobile: "Send to mobile",
    mpesa_withdraw: "M-PESA withdraw",
    mpesa_topup: "M-PESA top up",
    bill: "Bill payment",
    till: "Buy goods",
    airtime: "Airtime",
    salary: "Salary",
    deposit: "Deposit",
    card: "Card payment",
    other: "Other",
  };
  return map[c];
}
