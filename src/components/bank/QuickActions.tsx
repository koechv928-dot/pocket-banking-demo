import type { LinkProps } from "@tanstack/react-router";
import { ArrowLeftRight, FileText, Lightbulb, Mountain, Phone, Store, Wallet, ArrowDownToLine } from "lucide-react";
import type { QuickActionId } from "@/lib/bank/types";
import type { TKey } from "@/lib/i18n";

export interface QuickAction {
  id: QuickActionId;
  label: string;
  labelKey?: TKey;
  icon: typeof Wallet;
  circle: string;
  link: { to: LinkProps["to"]; search?: Record<string, string> };
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "internal", label: "Pay to Kilele", icon: Mountain, circle: "bg-navy text-brand", link: { to: "/send", search: { type: "internal" } } },
  { id: "mobile", label: "Pay to M-Pesa", icon: Wallet, circle: "bg-mpesa text-success-foreground", link: { to: "/send", search: { type: "mobile" } } },
  { id: "airtime", label: "Airtime", icon: Phone, circle: "bg-lime/20 text-lime", link: { to: "/airtime" } },
  { id: "bills", label: "My Bills", icon: Lightbulb, circle: "bg-warning/20 text-warning", link: { to: "/bills", search: { tab: "billers" } } },
  { id: "till", label: "Buy Goods", icon: Store, circle: "bg-teal/15 text-teal", link: { to: "/bills", search: { tab: "till" } } },
  { id: "topup", label: "Top up", icon: ArrowDownToLine, circle: "bg-success/15 text-success", link: { to: "/mpesa", search: { mode: "topup" } } },
  { id: "own", label: "Own transfer", icon: ArrowLeftRight, circle: "bg-secondary text-primary", link: { to: "/send", search: { type: "own" } } },
  { id: "statements", label: "Statements", icon: FileText, circle: "bg-steel/15 text-steel", link: { to: "/statements" } },
];
