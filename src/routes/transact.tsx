import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, ChevronRight, FileText, Landmark, Lightbulb, Phone, Smartphone, Store, Wallet } from "lucide-react";
import { useBank } from "@/lib/bank/store";
import { PageHeader, SectionTitle } from "@/components/bank/PageHeader";

export const Route = createFileRoute("/transact")({
  head: () => ({
    meta: [
      { title: "Transact - Kilele Bank" },
      { name: "description", content: "Send money, pay bills, buy airtime and use M-PESA in the Kilele Bank demo app." },
      { property: "og:title", content: "Transact - Kilele Bank" },
      { property: "og:description", content: "Demo payments and transfers." },
    ],
  }),
  component: Transact,
});

function Transact() {
  const { t } = useBank();

  const groups = [
    {
      title: t("sendMoney"),
      items: [
        { label: t("ownAccount"), hint: "Move money between your accounts", icon: ArrowLeftRight, link: { to: "/send", search: { type: "own" } } },
        { label: t("kileleAccount"), hint: "Send to another Kilele account", icon: Landmark, link: { to: "/send", search: { type: "internal" } } },
        { label: t("otherBank"), hint: "Send to an account at another bank", icon: Landmark, link: { to: "/send", search: { type: "bank" } } },
        { label: t("sendToMobile"), hint: "Send to any mobile number", icon: Smartphone, link: { to: "/send", search: { type: "mobile" } } },
      ],
    },
    {
      title: "M-PESA",
      items: [
        { label: "Withdraw to M-PESA", hint: "Move money to your M-PESA wallet", icon: Wallet, link: { to: "/mpesa", search: { mode: "withdraw" } } },
        { label: "Top up from M-PESA", hint: "Add money to your account", icon: Wallet, link: { to: "/mpesa", search: { mode: "topup" } } },
      ],
    },
    {
      title: "Pay & buy",
      items: [
        { label: t("payBills"), hint: "Saved billers and paybill numbers", icon: Lightbulb, link: { to: "/bills", search: { tab: "billers" } } },
        { label: t("buyGoods"), hint: "Pay a till number", icon: Store, link: { to: "/bills", search: { tab: "till" } } },
        { label: t("buyAirtime"), hint: "Safaricom, Airtel and Telkom", icon: Phone, link: { to: "/airtime" } },
      ],
    },
    {
      title: "Records",
      items: [{ label: t("statements"), hint: "Filter, view and download", icon: FileText, link: { to: "/statements" } }],
    },
  ];

  return (
    <div>
      <PageHeader title={t("transact")} back={false} />
      <div className="px-4 pb-4">
        {groups.map((g) => (
          <section key={g.title}>
            <SectionTitle>{g.title}</SectionTitle>
            <div className="divide-y rounded-2xl bg-card px-2 shadow-card">
              {g.items.map((it) => (
                <Link
                  key={it.label}
                  {...(it.link as { to: "/airtime" })}
                  className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-muted/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <it.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{it.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{it.hint}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
