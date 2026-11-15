import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { BankState, Merchant, MerchantType, Settings, Txn, TxnDraft, CardLimits } from "./types";
import { createSeedState, STATE_VERSION } from "./seed";
import {
  applyMerchantEdit,
  balanceOf,
  checkPin,
  formatKES,
  generateRef,
  lookupMerchant,
  payToLabel,
  uid,
  validateMerchant,
  type PinResult,
} from "./logic";
import { translate, type TKey } from "../i18n";

const STORAGE_KEY = "kilele-demo-state-v1";
const SESSION_KEY = "kilele-session";

type CommitResult = { ok: true; txn: Txn } | { ok: false; error: string };
type MerchantInput = { number: string; name: string; type: MerchantType };
type MerchantResult = { ok: true; merchant: Merchant } | { ok: false; errors: { number?: string; name?: string } };

export interface BankContextValue {
  state: BankState;
  authed: boolean;
  t: (k: TKey) => string;
  balance: (accountId: string) => number;
  login: (pin: string) => PinResult;
  loginBiometric: () => void;
  logout: () => void;
  verifyPin: (pin: string) => PinResult;
  commitTxn: (draft: TxnDraft) => CommitResult;
  setSettings: (patch: Partial<Settings>) => void;
  changePin: (newPin: string) => void;
  resetPinWithOtp: (newPin: string) => void;
  addMerchant: (m: MerchantInput) => MerchantResult;
  updateMerchant: (id: string, m: MerchantInput, updatePast: boolean) => MerchantResult;
  deleteMerchant: (id: string) => void;
  upsertTxn: (txn: Txn) => void;
  deleteTxn: (id: string) => void;
  deleteBiller: (id: string) => void;
  deleteBeneficiary: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  setCardFrozen: (frozen: boolean) => void;
  setCardLimits: (limits: CardLimits) => void;
  setOpeningBalance: (accountId: string, amount: number) => void;
  resetData: () => void;
}

const BankContext = createContext<BankContextValue | null>(null);
const ReadyContext = createContext(false);

function loadState(): BankState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BankState;
      if (parsed?.version === STATE_VERSION && Array.isArray(parsed.transactions)) return parsed;
    }
  } catch {
    /* fall back to seed */
  }
  return createSeedState();
}

export function BankProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<BankState | null>(null);
  const [authed, setAuthed] = useState(false);
  const ref = useRef<BankState | null>(null);

  const setState = useCallback((next: BankState) => {
    ref.current = next;
    setStateRaw(next);
  }, []);

  const update = useCallback(
    (fn: (s: BankState) => BankState) => {
      if (!ref.current) return;
      setState(fn(ref.current));
    },
    [setState],
  );

  useEffect(() => {
    setState(loadState());
    try {
      setAuthed(window.sessionStorage.getItem(SESSION_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, [setState]);

  useEffect(() => {
    if (!state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked */
    }
  }, [state]);

  useEffect(() => {
    if (!state) return;
    document.documentElement.classList.toggle("dark", state.settings.dark);
    document.documentElement.lang = state.settings.lang;
  }, [state?.settings.dark, state?.settings.lang, state]);

  const setSession = useCallback((v: boolean) => {
    setAuthed(v);
    try {
      if (v) window.sessionStorage.setItem(SESSION_KEY, "1");
      else window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<BankContextValue | null>(() => {
    if (!state) return null;

    const verifyPin = (pin: string): PinResult => {
      const s = ref.current!;
      const res = checkPin(s.security, s.pin, pin, Date.now());
      if (res.security !== s.security) setState({ ...s, security: res.security });
      return res;
    };

    const notify = (s: BankState, title: string, body: string): BankState =>
      s.settings.notifications
        ? {
            ...s,
            notifications: [
              { id: uid(), title, body, date: new Date().toISOString(), read: false },
              ...s.notifications,
            ].slice(0, 50),
          }
        : s;

    return {
      state,
      authed,
      t: (k) => translate(state.settings.lang, k),
      balance: (id) => balanceOf(state, id),
      verifyPin,
      login: (pin) => {
        const res = verifyPin(pin);
        if (res.ok) setSession(true);
        return res;
      },
      loginBiometric: () => setSession(true),
      logout: () => setSession(false),
      commitTxn: (draft) => {
        let s = ref.current!;
        const acc = s.accounts.find((a) => a.id === draft.accountId);
        if (!acc) return { ok: false, error: "Account not found" };
        if (!(draft.amount > 0)) return { ok: false, error: "Enter an amount greater than 0" };
        if (draft.direction === "debit") {
          const avail = balanceOf(s, acc.id);
          if (draft.amount + draft.fee > avail)
            return { ok: false, error: `Insufficient funds. Available balance is ${formatKES(avail)}` };
        }
        let merchantId = draft.merchantId;
        let description = draft.description;
        if (draft.newMerchant) {
          const existing = lookupMerchant(s.merchants, draft.newMerchant.number);
          if (existing) merchantId = existing.id;
          else {
            const m: Merchant = { id: uid(), ...draft.newMerchant, name: draft.newMerchant.name.trim() };
            s = { ...s, merchants: [...s.merchants, m] };
            merchantId = m.id;
            description = payToLabel(m);
          }
        }
        const now = new Date().toISOString();
        const txnRef = generateRef();
        const txn: Txn = {
          id: uid(),
          ref: txnRef,
          accountId: acc.id,
          direction: draft.direction,
          amount: draft.amount,
          fee: draft.fee,
          description,
          category: draft.category,
          counterparty: draft.counterparty,
          counterpartyNumber: draft.counterpartyNumber,
          merchantId,
          merchantType: draft.merchantType,
          details: draft.details,
          date: now,
        };
        const newTxns = [txn];
        if (draft.toAccountId) {
          const to = s.accounts.find((a) => a.id === draft.toAccountId);
          if (to)
            newTxns.push({
              id: uid(),
              ref: txnRef,
              accountId: to.id,
              direction: "credit",
              amount: draft.amount,
              fee: 0,
              description: `Transfer from ${acc.name}`,
              category: "transfer",
              counterparty: acc.name,
              counterpartyNumber: acc.number,
              details: draft.details,
              date: now,
            });
        }
        s = { ...s, transactions: [...newTxns, ...s.transactions] };
        const sb = draft.saveBeneficiary;
        if (sb && !s.beneficiaries.some((b) => b.kind === sb.kind && b.number === sb.number)) {
          s = { ...s, beneficiaries: [...s.beneficiaries, { id: uid(), ...sb }] };
        }
        const bl = draft.saveBiller;
        if (bl && !s.billers.some((b) => b.paybill === bl.paybill && b.accountNumber === bl.accountNumber)) {
          s = { ...s, billers: [...s.billers, { id: uid(), ...bl }] };
        }
        s = notify(
          s,
          draft.direction === "credit" ? "Money received" : "Transaction successful",
          `${formatKES(draft.amount)} - ${description}. Ref ${txnRef}`,
        );
        setState(s);
        return { ok: true, txn };
      },
      setSettings: (patch) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      changePin: (newPin) => update((s) => ({ ...s, pin: newPin, security: { failed: 0, lockUntil: 0 } })),
      resetPinWithOtp: (newPin) => update((s) => ({ ...s, pin: newPin, security: { failed: 0, lockUntil: 0 } })),
      addMerchant: (m) => {
        const s = ref.current!;
        const errors = validateMerchant(s.merchants, m);
        if (errors.number || errors.name) return { ok: false, errors };
        const merchant: Merchant = { id: uid(), number: m.number.trim(), name: m.name.trim(), type: m.type };
        setState({ ...s, merchants: [...s.merchants, merchant] });
        return { ok: true, merchant };
      },
      updateMerchant: (id, m, updatePast) => {
        const s = ref.current!;
        const errors = validateMerchant(s.merchants, m, id);
        if (errors.number || errors.name) return { ok: false, errors };
        const next = applyMerchantEdit(s, id, m, updatePast);
        setState(next);
        return { ok: true, merchant: next.merchants.find((x) => x.id === id)! };
      },
      deleteMerchant: (id) => update((s) => ({ ...s, merchants: s.merchants.filter((m) => m.id !== id) })),
      upsertTxn: (txn) =>
        update((s) => ({
          ...s,
          transactions: s.transactions.some((t) => t.id === txn.id)
            ? s.transactions.map((t) => (t.id === txn.id ? txn : t))
            : [txn, ...s.transactions],
        })),
      deleteTxn: (id) => update((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) })),
      deleteBiller: (id) => update((s) => ({ ...s, billers: s.billers.filter((b) => b.id !== id) })),
      deleteBeneficiary: (id) => update((s) => ({ ...s, beneficiaries: s.beneficiaries.filter((b) => b.id !== id) })),
      markNotificationRead: (id) =>
        update((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () =>
        update((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      clearNotifications: () => update((s) => ({ ...s, notifications: [] })),
      setCardFrozen: (frozen) => update((s) => ({ ...s, card: { ...s.card, frozen } })),
      setCardLimits: (limits) => update((s) => ({ ...s, card: { ...s.card, limits } })),
      setOpeningBalance: (id, amount) =>
        update((s) => ({
          ...s,
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, openingBalance: amount } : a)),
        })),
      resetData: () => {
        const prev = ref.current!;
        const seed = createSeedState();
        // Keep display preferences so the screen doesn't flash.
        setState({ ...seed, settings: { ...seed.settings, dark: prev.settings.dark, lang: prev.settings.lang } });
      },
    };
  }, [state, authed, setState, setSession, update]);

  return (
    <ReadyContext.Provider value={value !== null}>
      <BankContext.Provider value={value}>{children}</BankContext.Provider>
    </ReadyContext.Provider>
  );
}

export function useBankReady() {
  return useContext(ReadyContext);
}

export function useBankMaybe() {
  return useContext(BankContext);
}

export function useBank() {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error("useBank must be used after the demo data has loaded");
  return ctx;
}
