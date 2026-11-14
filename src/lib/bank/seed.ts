import type { BankState, Txn, TxnCategory, Direction } from "./types";
import { DEFAULT_PIN } from "./profile";

export const STATE_VERSION = 1;

type Row = [
  days: number,
  time: string,
  account: "acc-current" | "acc-savings",
  direction: Direction,
  amount: number,
  fee: number,
  category: TxnCategory,
  description: string,
  counterparty?: string,
  number?: string,
  merchantId?: string,
];

const ROWS: Row[] = [
  [1, "09:14", "acc-current", "debit", 450, 0, "till", "Pay to: CANDY SHOP, Till 123456", "Candy Shop", "123456", "m-candy"],
  [1, "13:02", "acc-current", "debit", 200, 0, "airtime", "Airtime - Safaricom 0712***678", "Safaricom", "0712345678"],
  [2, "18:40", "acc-current", "debit", 3250, 0, "bill", "Pay to: KPLC PREPAID, Paybill 888880", "KPLC Prepaid", "888880", "m-kplc"],
  [3, "08:00", "acc-current", "credit", 25000, 0, "deposit", "Cash deposit - Nairobi CBD Branch"],
  [4, "12:30", "acc-current", "debit", 5000, 33, "mpesa_withdraw", "Withdraw to M-PESA 0712***678", "M-PESA", "0712345678"],
  [5, "19:20", "acc-current", "debit", 2999, 0, "bill", "Pay to: DSTV, Paybill 444900", "DSTV", "444900", "m-dstv"],
  [6, "10:11", "acc-current", "debit", 1200, 33, "send_mobile", "Sent to Jane Wanjiru 0722***901", "Jane Wanjiru", "0722345901"],
  [7, "09:00", "acc-current", "credit", 10000, 0, "mpesa_topup", "Top up from M-PESA 0712***678", "M-PESA", "0712345678"],
  [8, "15:45", "acc-current", "debit", 4500, 0, "card", "Card payment - Naivas Westlands"],
  [9, "11:20", "acc-current", "debit", 20000, 0, "transfer", "Transfer to Savings Account", "Savings Account", "1100987654310"],
  [9, "11:20", "acc-savings", "credit", 20000, 0, "transfer", "Transfer from Current Account", "Current Account", "1100234567825"],
  [10, "14:00", "acc-current", "debit", 15000, 55, "send_bank", "Sent to Brian Otieno - Equity Bank", "Brian Otieno", "0180291234567"],
  [12, "16:30", "acc-current", "debit", 3500, 0, "bill", "Pay to: ZUKU, Paybill 320320", "Zuku", "320320", "m-zuku"],
  [14, "08:05", "acc-current", "debit", 1850, 0, "bill", "Pay to: NAIROBI WATER, Paybill 444400", "Nairobi Water", "444400", "m-nwater"],
  [15, "12:12", "acc-current", "debit", 650, 0, "till", "Pay to: JAVA HOUSE, Till 543210", "Java House", "543210", "m-java"],
  [18, "10:00", "acc-current", "credit", 4800, 0, "deposit", "Refund - Jumia Kenya"],
  [20, "09:30", "acc-current", "debit", 500, 0, "airtime", "Airtime - Airtel 0733***456", "Airtel", "0733123456"],
  [24, "17:00", "acc-current", "debit", 7800, 0, "send_internal", "Sent to Mary Chebet - Kilele", "Mary Chebet", "1100345678912"],
  [28, "08:00", "acc-current", "credit", 185000, 0, "salary", "Salary - Tausi Logistics Ltd"],
  [29, "13:40", "acc-current", "debit", 12000, 0, "card", "Card payment - Carrefour Two Rivers"],
  [32, "10:30", "acc-current", "debit", 2400, 0, "bill", "Pay to: WATER (KIAMBU), Paybill 223344", "Water (Kiambu)", "223344", "m-water"],
  [30, "06:00", "acc-savings", "credit", 1240.55, 0, "other", "Interest earned"],
  [45, "09:00", "acc-savings", "credit", 50000, 0, "deposit", "Standing order - Savings plan"],
];

function isoDaysAgo(now: Date, days: number, time: string) {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.toISOString();
}

export function createSeedState(now: Date = new Date()): BankState {
  const transactions: Txn[] = ROWS.map((r, i) => {
    const [days, time, accountId, direction, amount, fee, category, description, counterparty, number, merchantId] = r;
    // The own-account transfer pair (rows 9 and 10) shares one reference.
    const ref = i === 9 || i === 10 ? "KLB9TRF4X2" : `KLB${(7300000 + i * 7919).toString(36).toUpperCase().padStart(7, "0")}`;
    return {
      id: `seed-${i}`,
      ref,
      accountId,
      direction,
      amount,
      fee,
      category,
      description,
      counterparty,
      counterpartyNumber: number,
      merchantId,
      merchantType: merchantId ? (category === "till" ? "till" : "paybill") : undefined,
      date: isoDaysAgo(now, days, time),
    };
  });

  return {
    version: STATE_VERSION,
    pin: DEFAULT_PIN,
    accounts: [
      { id: "acc-current", name: "Current Account", type: "current", number: "1100234567825", openingBalance: 98650.5 },
      { id: "acc-savings", name: "Savings Account", type: "savings", number: "1100987654310", openingBalance: 412300 },
    ],
    transactions,
    beneficiaries: [
      { id: "b-jane", name: "Jane Wanjiru", kind: "mobile", number: "0722345901" },
      { id: "b-brian", name: "Brian Otieno", kind: "bank", bank: "Equity Bank", number: "0180291234567" },
      { id: "b-mary", name: "Mary Chebet", kind: "internal", number: "1100345678912" },
    ],
    billers: [
      { id: "bl-kplc", name: "KPLC Prepaid", paybill: "888880", accountNumber: "37123456789" },
      { id: "bl-water", name: "Water (Kiambu)", paybill: "223344", accountNumber: "KW-204581" },
      { id: "bl-dstv", name: "DSTV", paybill: "444900", accountNumber: "7012345678" },
      { id: "bl-zuku", name: "Zuku", paybill: "320320", accountNumber: "123456" },
      { id: "bl-nwater", name: "Nairobi Water", paybill: "444400", accountNumber: "2045678" },
    ],
    merchants: [
      { id: "m-candy", number: "123456", name: "Candy Shop", type: "till" },
      { id: "m-java", number: "543210", name: "Java House", type: "till" },
      { id: "m-kplc", number: "888880", name: "KPLC Prepaid", type: "paybill" },
      { id: "m-water", number: "223344", name: "Water (Kiambu)", type: "paybill" },
      { id: "m-dstv", number: "444900", name: "DSTV", type: "paybill" },
      { id: "m-zuku", number: "320320", name: "Zuku", type: "paybill" },
      { id: "m-nwater", number: "444400", name: "Nairobi Water", type: "paybill" },
    ],
    notifications: [
      { id: "n-1", title: "Welcome to Kilele", body: "This is a demo app. No real money moves.", date: isoDaysAgo(now, 0, "08:00"), read: false },
      { id: "n-2", title: "Salary received", body: "KES 185,000.00 credited to your Current Account.", date: isoDaysAgo(now, 28, "08:01"), read: false },
      { id: "n-3", title: "Security tip", body: "Kilele will never ask for your PIN or OTP on a call.", date: isoDaysAgo(now, 3, "10:00"), read: true },
    ],
    card: { frozen: false, limits: { atm: 40000, pos: 150000, online: 50000 } },
    settings: {
      notifications: true,
      dark: false,
      lang: "en",
      hideBalance: true,
      quickActions: ["internal", "mobile", "airtime", "bills"],
    },
    security: { failed: 0, lockUntil: 0 },
  };
}
