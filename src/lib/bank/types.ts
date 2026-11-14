export type AccountType = "current" | "savings";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  number: string;
  openingBalance: number;
}

export type Direction = "credit" | "debit";

export type TxnCategory =
  | "transfer"
  | "send_internal"
  | "send_bank"
  | "send_mobile"
  | "mpesa_withdraw"
  | "mpesa_topup"
  | "bill"
  | "till"
  | "airtime"
  | "salary"
  | "deposit"
  | "card"
  | "other";

export interface DetailLine {
  label: string;
  value: string;
}

export interface Txn {
  id: string;
  ref: string;
  accountId: string;
  direction: Direction;
  amount: number;
  fee: number;
  description: string;
  category: TxnCategory;
  counterparty?: string;
  counterpartyNumber?: string;
  merchantId?: string;
  merchantType?: MerchantType;
  details?: DetailLine[];
  /** ISO date-time */
  date: string;
}

export type BeneficiaryKind = "internal" | "bank" | "mobile";

export interface Beneficiary {
  id: string;
  name: string;
  kind: BeneficiaryKind;
  bank?: string;
  number: string;
}

export interface Biller {
  id: string;
  name: string;
  paybill: string;
  accountNumber: string;
}

export type MerchantType = "till" | "paybill";

export interface Merchant {
  id: string;
  number: string;
  name: string;
  type: MerchantType;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export interface CardLimits {
  atm: number;
  pos: number;
  online: number;
}

export interface CardState {
  frozen: boolean;
  limits: CardLimits;
}

export type Lang = "en" | "sw";

export type QuickActionId =
  | "internal"
  | "mobile"
  | "airtime"
  | "bills"
  | "till"
  | "topup"
  | "own"
  | "statements";

export interface Settings {
  notifications: boolean;
  dark: boolean;
  lang: Lang;
  hideBalance: boolean;
  quickActions: QuickActionId[];
}

export interface Security {
  failed: number;
  lockUntil: number;
}

export interface BankState {
  version: number;
  pin: string;
  accounts: Account[];
  transactions: Txn[];
  beneficiaries: Beneficiary[];
  billers: Biller[];
  merchants: Merchant[];
  notifications: AppNotification[];
  card: CardState;
  settings: Settings;
  security: Security;
}

/** What a feature screen hands to the shared confirm → PIN → receipt flow. */
export interface TxnDraft {
  title: string;
  accountId: string;
  direction: Direction;
  amount: number;
  fee: number;
  category: TxnCategory;
  description: string;
  counterparty?: string;
  counterpartyNumber?: string;
  merchantId?: string;
  merchantType?: MerchantType;
  /** Headline like "Pay to: CANDY SHOP, Till 123456" */
  payTo?: string;
  details: DetailLine[];
  toAccountId?: string;
  newMerchant?: Omit<Merchant, "id">;
  saveBeneficiary?: Omit<Beneficiary, "id">;
  saveBiller?: Omit<Biller, "id">;
  processingMs?: number;
  processingText?: string;
  stkPhone?: string;
}
