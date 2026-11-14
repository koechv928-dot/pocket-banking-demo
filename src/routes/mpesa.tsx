import { createFileRoute } from "@tanstack/react-router";
import { PendingScreen } from "@/components/bank/PendingScreen";

export const Route = createFileRoute("/mpesa")({
  validateSearch: (s: Record<string, unknown>): { mode?: string } => (typeof s.mode === "string" ? { mode: s.mode } : {}),
  head: () => ({
    meta: [
      { title: "M-PESA - Kilele Bank" },
      { name: "description", content: "M-PESA in the Kilele Bank demo app." },
      { property: "og:title", content: "M-PESA - Kilele Bank" },
      { property: "og:description", content: "M-PESA in the Kilele Bank demo app." },
    ],
  }),
  component: () => <PendingScreen title="M-PESA" />,
});
