import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { useBank } from "@/lib/bank/store";
import { HOLDER } from "@/lib/bank/profile";
import { maskAccount, formatPhone } from "@/lib/bank/logic";
import { PageHeader, SectionTitle } from "@/components/bank/PageHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile - Kilele Bank" },
      { name: "description", content: "Your profile details in the Kilele Bank demo app." },
      { property: "og:title", content: "Profile - Kilele Bank" },
      { property: "og:description", content: "Demo profile and account details." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { state, t } = useBank();
  const rows: [string, string][] = [
    ["Full name", HOLDER.fullName],
    ["Phone", formatPhone(HOLDER.phone)],
    ["Email", HOLDER.email],
    ["ID number", HOLDER.idNumber],
    ["Branch", HOLDER.branch],
    ["Customer since", HOLDER.memberSince],
  ];
  return (
    <div>
      <PageHeader title={t("profile")} />
      <div className="space-y-4 p-4">
        <div className="flex flex-col items-center rounded-2xl bg-card p-5 text-center shadow-card">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-2xl font-bold text-primary">
            {HOLDER.initials}
          </span>
          <p className="mt-3 text-lg font-bold text-foreground">{HOLDER.fullName}</p>
          <p className="text-xs text-muted-foreground">Demo profile with sample details</p>
        </div>

        <dl className="divide-y rounded-2xl bg-card px-4 shadow-card">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>

        <SectionTitle>My accounts</SectionTitle>
        <ul className="divide-y rounded-2xl bg-card px-4 shadow-card">
          {state.accounts.map((a) => (
            <li key={a.id} className="flex justify-between gap-4 py-3 text-sm">
              <span className="font-medium text-foreground">{a.name}</span>
              <span className="text-muted-foreground">{maskAccount(a.number)}</span>
            </li>
          ))}
        </ul>

        <Button asChild variant="soft" size="xl" className="w-full">
          <Link to="/settings">
            <SettingsIcon /> {t("settings")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
