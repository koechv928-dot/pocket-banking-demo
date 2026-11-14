import { createFileRoute } from "@tanstack/react-router";
import { PendingScreen } from "@/components/bank/PendingScreen";

export const Route = createFileRoute("/bills")({
  validateSearch: (s: Record<string, unknown>): { tab?: string } => (typeof s.tab === "string" ? { tab: s.tab } : {}),
  head: () => ({
    meta: [
      { title: "Pay Bills - Kilele Bank" },
      { name: "description", content: "Pay Bills in the Kilele Bank demo app." },
      { property: "og:title", content: "Pay Bills - Kilele Bank" },
      { property: "og:description", content: "Pay Bills in the Kilele Bank demo app." },
    ],
  }),
  component: () => <PendingScreen title="Pay Bills" />,
});
